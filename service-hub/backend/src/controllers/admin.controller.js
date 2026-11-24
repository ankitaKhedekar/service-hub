const { DateTime } = require('luxon');
const { User, ProviderProfile, Category, Service, Booking, Notification } = require('../models');
const ApiError = require('../utils/ApiError');
const { ok, paginate, pageMeta, escapeRegex } = require('../utils/respond');
const { attachPeople, bookingFilter } = require('./booking.controller');
const { timezone } = require('../config/env');

// GET /api/admin/stats?days=7
exports.stats = async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
  const now = DateTime.now().setZone(timezone);
  const since = now.startOf('day').minus({ days: days - 1 });
  const sinceDate = since.toUTC().toJSDate();

  const [
    bookingsInPeriod, revenueAgg, activeProviders, pendingProviders, customers, newCustomers, perDayAgg, byStatusAgg, topServicesAgg,
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: sinceDate } }),
    Booking.aggregate([{ $match: { status: 'completed', startTime: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
    ProviderProfile.countDocuments({ approvalStatus: 'approved' }),
    ProviderProfile.countDocuments({ approvalStatus: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: sinceDate } }),
    Booking.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([{ $match: { createdAt: { $gte: sinceDate } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      { $group: { _id: '$serviceTitle', count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const perDayMap = new Map(perDayAgg.map((d) => [d._id, d.count]));
  const perDay = [];
  for (let i = 0; i < days; i += 1) {
    const d = since.plus({ days: i });
    perDay.push({ date: d.toISODate(), label: d.toFormat('ccc d'), count: perDayMap.get(d.toISODate()) || 0 });
  }

  ok(res, {
    days,
    totalBookings: bookingsInPeriod,
    revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
    activeProviders,
    pendingProviders,
    customers,
    newCustomers,
    perDay,
    byStatus: ['completed', 'confirmed', 'pending', 'cancelled', 'rejected', 'no_show'].map((s) => ({
      status: s, count: (byStatusAgg.find((x) => x._id === s) || { count: 0 }).count,
    })),
    topServices: topServicesAgg.map((t) => ({ title: t._id, bookings: t.count, revenue: t.revenue })),
  });
};

// ---------- Providers ----------
exports.listProviders = async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, skip } = paginate(query);
  const filter = query.status ? { approvalStatus: query.status } : {};
  const [profiles, total] = await Promise.all([
    ProviderProfile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone isActive').lean(),
    ProviderProfile.countDocuments(filter),
  ]);
  const ids = profiles.map((p) => p.userId && p.userId._id).filter(Boolean);
  const serviceCounts = await Service.aggregate([{ $match: { providerId: { $in: ids } } }, { $group: { _id: '$providerId', n: { $sum: 1 } } }]);
  const countMap = new Map(serviceCounts.map((s) => [String(s._id), s.n]));

  ok(res, profiles.map((p) => ({
    id: p.userId ? p.userId._id : null,
    businessName: p.businessName,
    city: p.city,
    experienceYears: p.experienceYears,
    bio: p.bio,
    approvalStatus: p.approvalStatus,
    approvalNote: p.approvalNote,
    avgRating: p.avgRating,
    totalReviews: p.totalReviews,
    serviceCount: p.userId ? countMap.get(String(p.userId._id)) || 0 : 0,
    owner: p.userId ? { name: p.userId.name, email: p.userId.email, phone: p.userId.phone, isActive: p.userId.isActive } : null,
    appliedAt: p.createdAt,
  })), 200, pageMeta(page, limit, total));
};

exports.setProviderApproval = async (req, res) => {
  const { status, note } = req.body;
  const profile = await ProviderProfile.findOneAndUpdate({ userId: req.params.id }, { approvalStatus: status, approvalNote: note || '' }, { returnDocument: 'after' }).lean();
  if (!profile) throw ApiError.notFound('Provider not found');
  await Notification.notify(profile.userId, status === 'approved'
    ? 'Your provider account is approved. Your services are now visible to customers'
    : `Your provider application was not approved${note ? `: ${note}` : ''}`, { type: 'approval' });
  ok(res, { id: profile.userId, approvalStatus: profile.approvalStatus, approvalNote: profile.approvalNote });
};

// ---------- Categories ----------
exports.listCategories = async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Service.aggregate([{ $group: { _id: '$categoryId', n: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  ok(res, categories.map((c) => ({ id: c._id, name: c.name, slug: c.slug, description: c.description, isActive: c.isActive, serviceCount: countMap.get(String(c._id)) || 0 })));
};

exports.createCategory = async (req, res) => {
  const slug = Category.slugify(req.body.name);
  if (await Category.exists({ slug })) throw ApiError.conflict('A category with this name already exists');
  const category = await Category.create({ ...req.body, slug });
  ok(res, { id: category._id, name: category.name, slug: category.slug, description: category.description, isActive: category.isActive, serviceCount: 0 }, 201);
};

exports.updateCategory = async (req, res) => {
  const slug = Category.slugify(req.body.name);
  if (await Category.exists({ slug, _id: { $ne: req.params.id } })) throw ApiError.conflict('A category with this name already exists');
  const category = await Category.findByIdAndUpdate(req.params.id, { ...req.body, slug }, { returnDocument: 'after', runValidators: true }).lean();
  if (!category) throw ApiError.notFound('Category not found');
  ok(res, { id: category._id, name: category.name, slug: category.slug, description: category.description, isActive: category.isActive });
};

exports.deleteCategory = async (req, res) => {
  if (await Service.exists({ categoryId: req.params.id })) {
    throw ApiError.conflict('This category has services. Deactivate it instead of deleting');
  }
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Category not found');
  ok(res, { deleted: true });
};

// ---------- Services ----------
exports.listServices = async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.q) filter.title = new RegExp(escapeRegex(String(req.query.q).slice(0, 80)), 'i');
  const [services, total] = await Promise.all([
    Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('categoryId', 'name').lean(),
    Service.countDocuments(filter),
  ]);
  const profiles = await ProviderProfile.find({ userId: { $in: services.map((s) => s.providerId) } }, 'userId businessName').lean();
  const pMap = new Map(profiles.map((p) => [String(p.userId), p.businessName]));
  ok(res, services.map((s) => ({
    id: s._id, title: s.title, price: s.price, durationMinutes: s.durationMinutes, isActive: s.isActive,
    category: s.categoryId ? s.categoryId.name : '', provider: pMap.get(String(s.providerId)) || '',
  })), 200, pageMeta(page, limit, total));
};

exports.setServiceActive = async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { returnDocument: 'after' }).lean();
  if (!service) throw ApiError.notFound('Service not found');
  ok(res, { id: service._id, isActive: service.isActive });
};

// ---------- Users ----------
exports.listUsers = async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, skip } = paginate(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  ok(res, users.map((u) => u.toPublic()), 200, pageMeta(page, limit, total));
};

exports.setUserStatus = async (req, res) => {
  if (req.params.id === req.user.id) throw ApiError.badRequest('You cannot block your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Admin accounts cannot be blocked here');
  user.isActive = req.body.isActive;
  await user.save();
  ok(res, user.toPublic());
};

// ---------- Bookings ----------
exports.listBookings = async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, skip } = paginate(query);
  const filter = bookingFilter(query);
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    const people = await User.find({ name: rx }, '_id').lean();
    const ids = people.map((p) => p._id);
    const textMatch = [{ code: rx }, { serviceTitle: rx }, { customerId: { $in: ids } }, { providerId: { $in: ids } }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: textMatch }];
      delete filter.$or;
    } else {
      filter.$or = textMatch;
    }
  }
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  ok(res, await attachPeople(items), 200, pageMeta(page, limit, total));
};
