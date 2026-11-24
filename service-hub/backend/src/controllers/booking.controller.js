const { DateTime } = require('luxon');
const { Booking, Notification, Availability, User, ProviderProfile } = require('../models');
const ApiError = require('../utils/ApiError');
const { ok, paginate, pageMeta } = require('../utils/respond');
const { checkTransition } = require('../utils/bookingRules');
const { buildSlotKeys } = require('../utils/slots');
const { getBookableService, slotsForService } = require('../services/catalog');
const { timezone, cancelCutoffHours } = require('../config/env');

const STATUS_WORDS = {
  confirmed: 'confirmed',
  completed: 'marked completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
  no_show: 'marked as no-show',
};

/** Shape a booking for the API. Pass populated docs or plain ids. */
function shapeBooking(b, extras = {}) {
  return {
    id: b._id,
    code: b.code,
    serviceId: b.serviceId,
    serviceTitle: b.serviceTitle,
    price: b.price,
    durationMinutes: b.durationMinutes,
    startTime: b.startTime,
    endTime: b.endTime,
    address: b.address,
    notes: b.notes,
    status: b.status,
    cancelReason: b.cancelReason,
    reviewed: b.reviewed,
    statusHistory: (b.statusHistory || []).map((h) => ({ status: h.status, byRole: h.byRole, note: h.note, at: h.at })),
    createdAt: b.createdAt,
    ...extras,
  };
}

async function attachPeople(bookings) {
  const userIds = [...new Set(bookings.flatMap((b) => [String(b.customerId), String(b.providerId)]))];
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: userIds } }, 'name email phone').lean(),
    ProviderProfile.find({ userId: { $in: userIds } }, 'userId businessName').lean(),
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));
  return bookings.map((b) => {
    const c = userMap.get(String(b.customerId));
    const p = profileMap.get(String(b.providerId));
    return shapeBooking(b, {
      customer: c ? { id: c._id, name: c.name, phone: c.phone, email: c.email } : null,
      provider: { id: b.providerId, businessName: p ? p.businessName : 'Provider' },
    });
  });
}

/** Build a Mongo filter from ?status=&from=&to= used by all booking lists. */
function bookingFilter(query) {
  const filter = {};
  const now = new Date();
  if (query.status === 'upcoming') {
    filter.status = { $in: ['pending', 'confirmed'] };
    filter.startTime = { $gte: now };
  } else if (query.status === 'past') {
    filter.$or = [{ startTime: { $lt: now } }, { status: { $in: ['completed', 'cancelled', 'rejected', 'no_show'] } }];
  } else if (query.status) {
    filter.status = query.status;
  }
  if (query.from || query.to) {
    filter.startTime = { ...(filter.startTime || {}) };
    if (query.from) filter.startTime.$gte = DateTime.fromISO(query.from, { zone: timezone }).startOf('day').toUTC().toJSDate();
    if (query.to) filter.startTime.$lte = DateTime.fromISO(query.to, { zone: timezone }).endOf('day').toUTC().toJSDate();
  }
  return filter;
}

exports.attachPeople = attachPeople;
exports.bookingFilter = bookingFilter;

// POST /api/bookings  (customer)
exports.createBooking = async (req, res) => {
  const { serviceId, startTime, address, notes } = req.body;
  const { service } = await getBookableService(serviceId);

  const start = DateTime.fromJSDate(new Date(startTime)).setZone(timezone);
  const slots = await slotsForService(service, start.toISODate());
  const slot = slots.find((s) => new Date(s.start).getTime() === start.toMillis());
  if (!slot) throw ApiError.badRequest('This time is not a valid slot for this service');
  if (!slot.available) throw ApiError.conflict('Sorry, this slot was just booked. Please pick another time');

  const availability = await Availability.findOne({ providerId: service.providerId }).lean();
  const interval = (availability && availability.slotIntervalMinutes) || 60;

  // If two requests pass the check above at the same moment, the unique index makes the second insert fail (409).
  const booking = await Booking.create({
    customerId: req.user.id,
    providerId: service.providerId,
    serviceId: service._id,
    serviceTitle: service.title,
    price: service.price,
    durationMinutes: service.durationMinutes,
    startTime: new Date(slot.start),
    endTime: new Date(slot.end),
    address,
    notes: notes || '',
    status: 'pending',
    statusHistory: [{ status: 'pending', byUserId: req.user.id, byRole: 'customer', note: 'Booking requested' }],
    slotKeys: buildSlotKeys(slot.start, service.durationMinutes, interval),
  });

  const when = start.toFormat("ccc, d LLL 'at' hh:mm a");
  await Notification.notify(service.providerId, `New booking request ${booking.code}: ${service.title} on ${when}`, { type: 'booking', link: '/provider/bookings' });

  ok(res, shapeBooking(booking.toObject()), 201);
};

// GET /api/bookings/my  (customer)
exports.myBookings = async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, skip } = paginate(query);
  const filter = { ...bookingFilter(query), customerId: req.user.id };
  const sort = query.status === 'past' ? { startTime: -1 } : { startTime: 1 };
  const [items, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  ok(res, await attachPeople(items), 200, pageMeta(page, limit, total));
};

// GET /api/bookings/:id  (owner customer, owner provider, or admin)
exports.getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id).lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  const { id, role } = req.user;
  const allowed = role === 'admin' || String(booking.customerId) === id || String(booking.providerId) === id;
  if (!allowed) throw ApiError.notFound('Booking not found'); // don't reveal that it exists
  const [shaped] = await attachPeople([booking]);
  ok(res, shaped);
};

// PATCH /api/bookings/:id/status  (customer: cancel | provider: own bookings | admin: any)
exports.changeStatus = async (req, res) => {
  const { status, note } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isParty = req.user.role === 'admin' || String(booking.customerId) === req.user.id || String(booking.providerId) === req.user.id;
  if (!isParty) throw ApiError.notFound('Booking not found');

  const check = checkTransition({ user: req.user, booking, to: status, cancelCutoffHours });
  if (!check.allowed) throw new ApiError(check.status, check.reason);

  booking.applyStatus(status, req.user, note || '');
  await booking.save(); // slotLocked becomes false for cancelled/rejected, which frees the slot

  const words = STATUS_WORDS[status] || status;
  if (req.user.role !== 'customer') {
    await Notification.notify(booking.customerId, `Your booking ${booking.code} (${booking.serviceTitle}) was ${words}`, { type: 'status', link: `/bookings/${booking._id}` });
  }
  if (req.user.role !== 'provider') {
    await Notification.notify(booking.providerId, `Booking ${booking.code} (${booking.serviceTitle}) was ${words}`, { type: 'status', link: '/provider/bookings' });
  }

  const [shaped] = await attachPeople([booking.toObject()]);
  ok(res, shaped);
};
