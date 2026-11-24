// Shared read helpers for services, providers and slots.
const { DateTime } = require('luxon');
const { Availability, Booking, Category, ProviderProfile, Service, User } = require('../models');
const { generateSlots } = require('../utils/slots');
const { timezone, bookingWindowDays } = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Profiles of providers that are approved AND whose user account is active. */
async function approvedProviderProfiles(filter = {}) {
  const profiles = await ProviderProfile.find({ approvalStatus: 'approved', ...filter }).lean();
  const activeIds = new Set(
    (await User.find({ _id: { $in: profiles.map((p) => p.userId) }, isActive: true }, '_id').lean()).map((u) => String(u._id))
  );
  return profiles.filter((p) => activeIds.has(String(p.userId)));
}

function shapeProvider(profile) {
  if (!profile) return null;
  return {
    id: profile.userId,
    businessName: profile.businessName,
    city: profile.city,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    avgRating: Math.round((profile.avgRating || 0) * 10) / 10,
    totalReviews: profile.totalReviews || 0,
  };
}

function shapeService(service, category, profile) {
  return {
    id: service._id,
    title: service.title,
    description: service.description,
    price: service.price,
    durationMinutes: service.durationMinutes,
    imageUrl: service.imageUrl,
    isActive: service.isActive,
    category: category ? { id: category._id, name: category.name, slug: category.slug } : null,
    provider: shapeProvider(profile),
  };
}

/** Load a service that customers are allowed to see and book, or throw 404. */
async function getBookableService(serviceId) {
  const service = await Service.findById(serviceId).lean();
  if (!service || !service.isActive) throw ApiError.notFound('Service not found');
  const [category, profile, providerUser] = await Promise.all([
    Category.findById(service.categoryId).lean(),
    ProviderProfile.findOne({ userId: service.providerId }).lean(),
    User.findById(service.providerId).lean(),
  ]);
  if (!category || !category.isActive || !profile || profile.approvalStatus !== 'approved' || !providerUser || !providerUser.isActive) {
    throw ApiError.notFound('Service not found');
  }
  return { service, category, profile };
}

function todayInZone() {
  return DateTime.now().setZone(timezone).toISODate();
}

/** All slots for a service on a date, with `available` true/false. */
async function slotsForService(service, date, now = new Date()) {
  const day = DateTime.fromISO(date, { zone: timezone });
  if (!day.isValid) throw ApiError.badRequest('Invalid date');
  const today = DateTime.fromJSDate(now).setZone(timezone).startOf('day');
  if (day < today) return [];
  if (day > today.plus({ days: bookingWindowDays })) {
    throw ApiError.badRequest(`Bookings can be made up to ${bookingWindowDays} days ahead`);
  }

  const availability = await Availability.findOne({ providerId: service.providerId }).lean();
  const dayStart = day.startOf('day').toUTC().toJSDate();
  const dayEnd = day.endOf('day').toUTC().toJSDate();
  const active = await Booking.find(
    { providerId: service.providerId, slotLocked: true, startTime: { $lt: dayEnd }, endTime: { $gt: dayStart } },
    'slotKeys'
  ).lean();
  const takenKeys = new Set(active.flatMap((b) => b.slotKeys));

  return generateSlots({ date, availability, durationMinutes: service.durationMinutes, takenKeys, now, timezone });
}

module.exports = { approvedProviderProfiles, shapeProvider, shapeService, getBookableService, slotsForService, todayInZone };
