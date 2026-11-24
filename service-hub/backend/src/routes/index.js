const express = require('express');
const rateLimit = require('express-rate-limit');
const a = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../validators/schemas');

const auth = require('../controllers/auth.controller');
const pub = require('../controllers/public.controller');
const booking = require('../controllers/booking.controller');
const review = require('../controllers/review.controller');
const provider = require('../controllers/provider.controller');
const admin = require('../controllers/admin.controller');
const notification = require('../controllers/notification.controller');
const site = require('../controllers/site.controller');

const router = express.Router();
const id = validate(s.idParam, 'params');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes' },
});

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later' },
});

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));

// ---------- Auth ----------
router.post('/auth/register', authLimiter, validate(s.register), a(auth.register));
router.post('/auth/login', authLimiter, validate(s.login), a(auth.login));
router.get('/auth/me', authenticate, a(auth.me));

// ---------- Public catalog ----------
router.get('/categories', a(pub.listCategories));
router.get('/services', validate(s.serviceQuery, 'query'), a(pub.listServices));
router.get('/services/:id', id, a(pub.getService));
router.get('/services/:id/slots', id, validate(s.slotQuery, 'query'), a(pub.getServiceSlots));
router.get('/providers/:id', id, a(pub.getProvider));

// ---------- Public website ----------
router.get('/site/stats', a(site.stats));
router.get('/site/reviews', a(site.reviews));
router.post('/site/newsletter', formLimiter, validate(s.newsletter), a(site.subscribe));
router.post('/site/contact', formLimiter, validate(s.contact), a(site.contact));

// ---------- Bookings (customer + shared) ----------
router.post('/bookings', authenticate, authorize('customer'), validate(s.createBooking), a(booking.createBooking));
router.get('/bookings/my', authenticate, authorize('customer'), validate(s.bookingQuery, 'query'), a(booking.myBookings));
router.get('/bookings/:id', authenticate, id, a(booking.getBooking));
router.patch('/bookings/:id/status', authenticate, id, validate(s.changeStatus), a(booking.changeStatus));

router.post('/reviews', authenticate, authorize('customer'), validate(s.createReview), a(review.createReview));

// ---------- Notifications (any logged-in user) ----------
router.get('/notifications', authenticate, a(notification.list));
router.patch('/notifications/read-all', authenticate, a(notification.markAllRead));
router.patch('/notifications/:id/read', authenticate, id, a(notification.markRead));

// ---------- Provider ----------
const p = express.Router();
p.use(authenticate, authorize('provider'));
p.get('/profile', a(provider.getProfile));
p.put('/profile', validate(s.providerProfile), a(provider.updateProfile));
p.get('/stats', a(provider.stats));
p.get('/services', a(provider.listServices));
p.post('/services', validate(s.serviceBody), a(provider.createService));
p.put('/services/:id', id, validate(s.serviceBody), a(provider.updateService));
p.delete('/services/:id', id, a(provider.deleteService));
p.get('/availability', a(provider.getAvailability));
p.put('/availability', validate(s.availability), a(provider.updateAvailability));
p.get('/bookings', validate(s.bookingQuery, 'query'), a(provider.listBookings));
router.use('/provider', p);

// ---------- Admin ----------
const ad = express.Router();
ad.use(authenticate, authorize('admin'));
ad.get('/stats', a(admin.stats));
ad.get('/providers', validate(s.providerQuery, 'query'), a(admin.listProviders));
ad.patch('/providers/:id/approval', id, validate(s.approval), a(admin.setProviderApproval));
ad.get('/categories', a(admin.listCategories));
ad.post('/categories', validate(s.categoryBody), a(admin.createCategory));
ad.put('/categories/:id', id, validate(s.categoryBody), a(admin.updateCategory));
ad.delete('/categories/:id', id, a(admin.deleteCategory));
ad.get('/services', a(admin.listServices));
ad.patch('/services/:id/active', id, validate(s.serviceActive), a(admin.setServiceActive));
ad.get('/users', validate(s.userQuery, 'query'), a(admin.listUsers));
ad.patch('/users/:id/status', id, validate(s.userStatus), a(admin.setUserStatus));
ad.get('/bookings', validate(s.bookingQuery, 'query'), a(admin.listBookings));
ad.get('/messages', a(site.listMessages));
ad.patch('/messages/:id', id, validate(s.messageStatus), a(site.setMessageStatus));
router.use('/admin', ad);

module.exports = router;
