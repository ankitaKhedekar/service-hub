const mongoose = require('mongoose');
const { Category, Service, ProviderProfile, Review, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { ok, paginate, pageMeta, escapeRegex } = require('../utils/respond');
const { approvedProviderProfiles, shapeProvider, shapeService, getBookableService, slotsForService } = require('../services/catalog');

exports.listCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  const providerIds = (await approvedProviderProfiles()).map((p) => p.userId);
  const counts = await Service.aggregate([
    { $match: { isActive: true, providerId: { $in: providerIds } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  ok(res, categories.map((c) => ({ id: c._id, name: c.name, slug: c.slug, description: c.description, serviceCount: countMap.get(String(c._id)) || 0 })));
};

exports.listServices = async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, skip } = paginate(query);

  const profileFilter = query.city ? { city: new RegExp(`^${escapeRegex(query.city)}$`, 'i') } : {};
  const profiles = await approvedProviderProfiles(profileFilter);
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

  const categories = await Category.find({ isActive: true }).lean();
  const categoryMap = new Map(categories.map((c) => [String(c._id), c]));

  const filter = { isActive: true, providerId: { $in: profiles.map((p) => p.userId) }, categoryId: { $in: categories.map((c) => c._id) } };
  if (query.category) {
    const cat = categories.find((c) => c.slug === query.category || String(c._id) === query.category);
    if (!cat) return ok(res, [], 200, pageMeta(page, limit, 0));
    filter.categoryId = cat._id;
  }
  if (query.providerId) {
    if (!profileMap.has(query.providerId)) return ok(res, [], 200, pageMeta(page, limit, 0));
    filter.providerId = new mongoose.Types.ObjectId(query.providerId);
  }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const sort = { price_asc: { price: 1 }, price_desc: { price: -1 }, newest: { createdAt: -1 } }[query.sort];
  const [items, total] = await Promise.all([
    Service.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);

  ok(res, items.map((s) => shapeService(s, categoryMap.get(String(s.categoryId)), profileMap.get(String(s.providerId)))), 200, pageMeta(page, limit, total));
};

exports.getService = async (req, res) => {
  const { service, category, profile } = await getBookableService(req.params.id);
  ok(res, shapeService(service, category, profile));
};

exports.getServiceSlots = async (req, res) => {
  const { service } = await getBookableService(req.params.id);
  const slots = await slotsForService(service, req.validatedQuery.date);
  ok(res, { date: req.validatedQuery.date, durationMinutes: service.durationMinutes, slots });
};

exports.getProvider = async (req, res) => {
  const profile = await ProviderProfile.findOne({ userId: req.params.id, approvalStatus: 'approved' }).lean();
  const user = profile && (await User.findById(profile.userId).lean());
  if (!profile || !user || !user.isActive) throw ApiError.notFound('Provider not found');

  const [services, categories, reviews] = await Promise.all([
    Service.find({ providerId: profile.userId, isActive: true }).lean(),
    Category.find({ isActive: true }).lean(),
    Review.find({ providerId: profile.userId }).sort({ createdAt: -1 }).limit(10).populate('customerId', 'name').lean(),
  ]);
  const categoryMap = new Map(categories.map((c) => [String(c._id), c]));

  ok(res, {
    provider: shapeProvider(profile),
    services: services.filter((s) => categoryMap.has(String(s.categoryId))).map((s) => shapeService(s, categoryMap.get(String(s.categoryId)), profile)),
    reviews: reviews.map((r) => ({ id: r._id, rating: r.rating, comment: r.comment, customerName: r.customerId ? r.customerId.name : 'Customer', createdAt: r.createdAt })),
  });
};
