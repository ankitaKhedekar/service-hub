const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const { ProviderProfile, Service, Category, Availability, Booking, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { ok, paginate, pageMeta } = require('../utils/respond');
const { toMinutes } = require('../utils/slots');
const { shapeService } = require('../services/catalog');
const { attachPeople, bookingFilter } = require('./booking.controller');
const { timezone } = require('../config/env');

const oid = (id) => new mongoose.Types.ObjectId(String(id));

exports.getProfile = async (req, res) => {
  const [profile, user] = await Promise.all([
    ProviderProfile.findOne({ userId: req.user.id }).lean(),
    User.findById(req.user.id).lean(),
  ]);
  if (!profile) throw ApiError.notFound('Provider profile not found');
  ok(res, { ...profile, id: profile.userId, name: user.name, email: user.email, phone: user.phone });
};

exports.updateProfile = async (req, res) => {
  const { phone, ...profileFields } = req.body;
  const profile = await ProviderProfile.findOneAndUpdate({ userId: req.user.id }, profileFields, { returnDocument: 'after', runValidators: true }).lean();
  if (!profile) throw ApiError.notFound('Provider profile not found');
  if (phone !== undefined) await User.updateOne({ _id: req.user.id }, { phone });
  ok(res, profile);
};

exports.listServices = async (req, res) => {
  const [services, categories, profile] = await Promise.all([
    Service.find({ providerId: req.user.id }).sort({ createdAt: -1 }).lean(),
    Category.find().lean(),
    ProviderProfile.findOne({ userId: req.user.id }).lean(),
  ]);
  const catMap = new Map(categories.map((c) => [String(c._id), c]));
  ok(res, services.map((s) => shapeService(s, catMap.get(String(s.categoryId)), profile)));
};

async function assertActiveCategory(categoryId) {
  const category = await Category.findById(categoryId).lean();
  if (!category || !category.isActive) throw ApiError.badRequest('Please choose an active category');
  return category;
}

exports.createService = async (req, res) => {
  const category = await assertActiveCategory(req.body.categoryId);
  const service = await Service.create({ ...req.body, providerId: req.user.id });
  ok(res, shapeService(service.toObject(), category, null), 201);
};

exports.updateService = async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, providerId: req.user.id });
  if (!service) throw ApiError.notFound('Service not found');
  const category = await assertActiveCategory(req.body.categoryId);
  Object.assign(service, req.body);
  await service.save();
  ok(res, shapeService(service.toObject(), category, null));
};

exports.deleteService = async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, providerId: req.user.id });
  if (!service) throw ApiError.notFound('Service not found');
  if (await Booking.exists({ serviceId: service._id })) {
    service.isActive = false; // keep history intact; hide it instead
    await service.save();
    return ok(res, { deleted: false, hidden: true, message: 'This service has bookings, so it was hidden instead of deleted' });
  }
  await service.deleteOne();
  return ok(res, { deleted: true });
};

exports.getAvailability = async (req, res) => {
  let availability = await Availability.findOne({ providerId: req.user.id }).lean();
  if (!availability) availability = (await Availability.create({ providerId: req.user.id, weekly: Availability.defaultWeek() })).toObject();
  ok(res, availability);
};

exports.updateAvailability = async (req, res) => {
  const { weekly, slotIntervalMinutes, leaves } = req.body;
  const days = new Set(weekly.map((d) => d.day));
  if (days.size !== 7) throw ApiError.badRequest('Send one entry for each day of the week (0-6)');

  const cleanWeek = weekly
    .sort((a, b) => a.day - b.day)
    .map((d) => {
      const entry = { day: d.day, isOpen: d.isOpen, start: d.start, end: d.end };
      if (d.isOpen && toMinutes(d.start) >= toMinutes(d.end)) throw ApiError.badRequest(`Day ${d.day}: closing time must be after opening time`);
      if (d.breakStart && d.breakEnd) {
        if (toMinutes(d.breakStart) >= toMinutes(d.breakEnd)) throw ApiError.badRequest(`Day ${d.day}: break end must be after break start`);
        entry.breakStart = d.breakStart;
        entry.breakEnd = d.breakEnd;
      }
      return entry;
    });

  const availability = await Availability.findOneAndUpdate(
    { providerId: req.user.id },
    { weekly: cleanWeek, slotIntervalMinutes, leaves: [...new Set(leaves)].sort() },
    { returnDocument: 'after', upsert: true, runValidators: true }
  ).lean();
  ok(res, availability);
};

exports.listBookings = async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, skip } = paginate(query);
  const filter = { ...bookingFilter(query), providerId: req.user.id };
  const sort = query.status === 'past' || query.status === 'completed' ? { startTime: -1 } : { startTime: 1 };
  const [items, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  ok(res, await attachPeople(items), 200, pageMeta(page, limit, total));
};

exports.stats = async (req, res) => {
  const now = DateTime.now().setZone(timezone);
  const todayStart = now.startOf('day').toUTC().toJSDate();
  const todayEnd = now.endOf('day').toUTC().toJSDate();
  const monthStart = now.startOf('month').toUTC().toJSDate();
  const providerId = oid(req.user.id);

  const [todayBookings, pending, monthAgg, profile] = await Promise.all([
    Booking.countDocuments({ providerId, startTime: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['pending', 'confirmed', 'completed'] } }),
    Booking.countDocuments({ providerId, status: 'pending', startTime: { $gte: new Date() } }),
    Booking.aggregate([
      { $match: { providerId, status: 'completed', startTime: { $gte: monthStart } } },
      { $group: { _id: null, earnings: { $sum: '$price' }, jobs: { $sum: 1 } } },
    ]),
    ProviderProfile.findOne({ userId: providerId }).lean(),
  ]);

  ok(res, {
    todayBookings,
    pendingRequests: pending,
    monthEarnings: monthAgg[0] ? monthAgg[0].earnings : 0,
    monthCompletedJobs: monthAgg[0] ? monthAgg[0].jobs : 0,
    avgRating: profile ? profile.avgRating : 0,
    totalReviews: profile ? profile.totalReviews : 0,
    approvalStatus: profile ? profile.approvalStatus : 'pending',
  });
};
