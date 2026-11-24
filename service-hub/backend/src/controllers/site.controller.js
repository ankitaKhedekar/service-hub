// Public website endpoints: homepage numbers, recent reviews, newsletter, contact form.
const { Booking, Category, ProviderProfile, Review, Subscriber, ContactMessage, User } = require('../models');
const { ok, paginate, pageMeta } = require('../utils/respond');
const ApiError = require('../utils/ApiError');
const { approvedProviderProfiles } = require('../services/catalog');

// GET /api/site/stats - real numbers for the homepage trust strip
exports.stats = async (req, res) => {
  const [providers, completedBookings, categories, ratingAgg] = await Promise.all([
    approvedProviderProfiles().then((p) => p.length),
    Booking.countDocuments({ status: 'completed' }),
    Category.countDocuments({ isActive: true }),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]),
  ]);
  ok(res, {
    providers,
    completedBookings,
    categories,
    avgRating: ratingAgg[0] ? Math.round(ratingAgg[0].avg * 10) / 10 : 0,
    reviews: ratingAgg[0] ? ratingAgg[0].n : 0,
  });
};

// GET /api/site/reviews?limit=6 - recent 4-5 star reviews with a comment, for the testimonials carousel
exports.reviews = async (req, res) => {
  const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6));
  const reviews = await Review.find({ rating: { $gte: 4 }, comment: { $ne: '' } }).sort({ createdAt: -1 }).limit(limit).lean();
  const [users, profiles, bookings] = await Promise.all([
    User.find({ _id: { $in: reviews.map((r) => r.customerId) } }, 'name').lean(),
    ProviderProfile.find({ userId: { $in: reviews.map((r) => r.providerId) } }, 'userId businessName').lean(),
    Booking.find({ _id: { $in: reviews.map((r) => r.bookingId) } }, 'serviceTitle').lean(),
  ]);
  const uMap = new Map(users.map((u) => [String(u._id), u.name]));
  const pMap = new Map(profiles.map((p) => [String(p.userId), p.businessName]));
  const bMap = new Map(bookings.map((b) => [String(b._id), b.serviceTitle]));
  ok(res, reviews.map((r) => {
    const full = uMap.get(String(r.customerId)) || 'Customer';
    const [first, last] = full.split(' ');
    return {
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      customerName: last ? `${first} ${last[0]}.` : first, // privacy: first name + initial
      serviceTitle: bMap.get(String(r.bookingId)) || '',
      providerName: pMap.get(String(r.providerId)) || '',
      providerId: r.providerId,
      createdAt: r.createdAt,
    };
  }));
};

// POST /api/site/newsletter { email }
exports.subscribe = async (req, res) => {
  await Subscriber.updateOne({ email: req.body.email.toLowerCase() }, { $setOnInsert: { email: req.body.email.toLowerCase() } }, { upsert: true });
  ok(res, { subscribed: true }, 201);
};

// POST /api/site/contact { name, email, topic, message }
exports.contact = async (req, res) => {
  const msg = await ContactMessage.create(req.body);
  ok(res, { id: msg._id, received: true }, 201);
};

// ---------- admin ----------
exports.listMessages = async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = ['new', 'replied', 'closed'].includes(req.query.status) ? { status: req.query.status } : {};
  const [items, total, subscribers] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
    Subscriber.countDocuments(),
  ]);
  ok(res, items.map((m) => ({ id: m._id, name: m.name, email: m.email, topic: m.topic, message: m.message, status: m.status, createdAt: m.createdAt })),
    200, { ...pageMeta(page, limit, total), subscribers });
};

exports.setMessageStatus = async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after' }).lean();
  if (!msg) throw ApiError.notFound('Message not found');
  ok(res, { id: msg._id, status: msg.status });
};
