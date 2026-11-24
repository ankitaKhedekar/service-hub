const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).message('Time must be HH:mm');
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('Date must be YYYY-MM-DD');
const password = Joi.string().min(8).max(72).pattern(/[A-Za-z]/).pattern(/\d/)
  .messages({ 'string.pattern.base': 'Password must contain letters and numbers' });

const page = { page: Joi.number().integer().min(1), limit: Joi.number().integer().min(1).max(100) };

module.exports = {
  idParam: Joi.object({ id: objectId.required() }),

  register: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s]{7,15}$/).allow(''),
    password: password.required(),
    role: Joi.string().valid('customer', 'provider').default('customer'),
    businessName: Joi.when('role', { is: 'provider', then: Joi.string().trim().min(2).max(100).required(), otherwise: Joi.forbidden() }),
    city: Joi.string().trim().max(60).allow(''),
  }),

  login: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required(),
  }),

  serviceQuery: Joi.object({
    ...page,
    q: Joi.string().trim().max(80).allow(''),
    category: Joi.string().trim().max(80).allow(''), // slug or id
    city: Joi.string().trim().max(60).allow(''),
    providerId: objectId,
    sort: Joi.string().valid('price_asc', 'price_desc', 'newest').default('newest'),
  }),

  slotQuery: Joi.object({ date: date.required() }),

  createBooking: Joi.object({
    serviceId: objectId.required(),
    startTime: Joi.date().iso().required(),
    address: Joi.string().trim().min(5).max(300).required(),
    notes: Joi.string().trim().max(500).allow(''),
  }),

  changeStatus: Joi.object({
    status: Joi.string().valid('confirmed', 'completed', 'cancelled', 'rejected', 'no_show').required(),
    note: Joi.string().trim().max(300).allow(''),
  }),

  bookingQuery: Joi.object({
    ...page,
    status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show', 'upcoming', 'past'),
    q: Joi.string().trim().max(80).allow(''),
    from: date,
    to: date,
  }),

  createReview: Joi.object({
    bookingId: objectId.required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(1000).allow(''),
  }),

  providerProfile: Joi.object({
    businessName: Joi.string().trim().min(2).max(100),
    bio: Joi.string().trim().max(1000).allow(''),
    city: Joi.string().trim().max(60).allow(''),
    experienceYears: Joi.number().integer().min(0).max(60),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s]{7,15}$/).allow(''),
  }).min(1),

  serviceBody: Joi.object({
    categoryId: objectId.required(),
    title: Joi.string().trim().min(3).max(120).required(),
    description: Joi.string().trim().max(2000).allow(''),
    price: Joi.number().min(0).max(1000000).required(),
    durationMinutes: Joi.number().integer().min(15).max(600).required(),
    imageUrl: Joi.string().trim().uri().allow(''),
    isActive: Joi.boolean(),
  }),

  availability: Joi.object({
    slotIntervalMinutes: Joi.number().valid(15, 30, 60).required(),
    weekly: Joi.array().length(7).items(
      Joi.object({
        day: Joi.number().integer().min(0).max(6).required(),
        isOpen: Joi.boolean().required(),
        start: time.required(),
        end: time.required(),
        breakStart: time.allow(null, ''),
        breakEnd: time.allow(null, ''),
      })
    ).required(),
    leaves: Joi.array().items(date).max(100).default([]),
  }),

  approval: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    note: Joi.string().trim().max(300).allow(''),
  }),

  categoryBody: Joi.object({
    name: Joi.string().trim().min(2).max(60).required(),
    description: Joi.string().trim().max(300).allow(''),
    isActive: Joi.boolean(),
  }),

  userQuery: Joi.object({
    ...page,
    role: Joi.string().valid('customer', 'provider', 'admin'),
    q: Joi.string().trim().max(80).allow(''),
  }),

  providerQuery: Joi.object({
    ...page,
    status: Joi.string().valid('pending', 'approved', 'rejected'),
  }),

  newsletter: Joi.object({ email: Joi.string().trim().email().max(120).required() }),

  contact: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().max(120).required(),
    topic: Joi.string().valid('general', 'booking', 'provider', 'partnership', 'other').default('general'),
    message: Joi.string().trim().min(10).max(2000).required(),
    website: Joi.string().allow('').max(0).messages({ 'string.max': 'Invalid submission' }), // honeypot: bots fill hidden fields
  }),

  messageStatus: Joi.object({ status: Joi.string().valid('new', 'replied', 'closed').required() }),

  userStatus: Joi.object({ isActive: Joi.boolean().required() }),
  serviceActive: Joi.object({ isActive: Joi.boolean().required() }),
};
