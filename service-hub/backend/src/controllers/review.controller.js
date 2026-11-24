const mongoose = require('mongoose');
const { Booking, Review, ProviderProfile, Notification } = require('../models');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

async function refreshProviderRating(providerId) {
  const [stats] = await Review.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(String(providerId)) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await ProviderProfile.updateOne(
    { userId: providerId },
    { avgRating: stats ? Math.round(stats.avg * 10) / 10 : 0, totalReviews: stats ? stats.count : 0 }
  );
}

// POST /api/reviews  (customer, only for their own completed booking, once)
exports.createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking || String(booking.customerId) !== req.user.id) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'completed') throw ApiError.badRequest('You can review a booking only after it is completed');
  if (booking.reviewed || (await Review.exists({ bookingId }))) throw ApiError.conflict('You have already reviewed this booking');

  const review = await Review.create({
    bookingId, rating, comment: comment || '', customerId: req.user.id, providerId: booking.providerId, serviceId: booking.serviceId,
  });
  booking.reviewed = true;
  await booking.save();
  await refreshProviderRating(booking.providerId);
  await Notification.notify(booking.providerId, `New ${rating}-star review for ${booking.serviceTitle}`, { type: 'review' });

  ok(res, { id: review._id, rating: review.rating, comment: review.comment, createdAt: review.createdAt }, 201);
};

exports.refreshProviderRating = refreshProviderRating;
