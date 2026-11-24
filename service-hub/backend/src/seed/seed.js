/* eslint-disable no-console */
// Fills the database with demo data. Run: npm run seed
// WARNING: deletes existing Service Hub data first.
const { DateTime } = require('luxon');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { User, ProviderProfile, Category, Service, Availability, Booking, Review, Notification, Subscriber, ContactMessage } = require('../models');
const { buildSlotKeys } = require('../utils/slots');
const { refreshProviderRating } = require('../controllers/review.controller');

const PASSWORD = process.env.SEED_PASSWORD || 'Password@123';

/** A time in the app timezone, `dayOffset` days from today at `hour`. Skips Sundays for future dates (closed). */
function at(dayOffset, hour) {
  let d = DateTime.now().setZone(env.timezone).startOf('day').plus({ days: dayOffset });
  if (dayOffset > 0 && d.weekday === 7) d = d.plus({ days: 1 });
  return d.set({ hour, minute: 0 });
}

async function makeUser(name, email, role, phone = '') {
  const user = new User({ name, email, role, phone });
  await user.setPassword(PASSWORD);
  return user.save();
}

async function run() {
  if (env.isProd && !process.argv.includes('--force')) {
    console.error('Refusing to seed in production without --force');
    process.exit(1);
  }
  await connectDB(env.mongoUri);
  console.log('Connected. Clearing old data...');
  await Promise.all([User, ProviderProfile, Category, Service, Availability, Booking, Review, Notification, Subscriber, ContactMessage].map((m) => m.deleteMany({})));

  // ---------- Categories ----------
  const catNames = ['Cleaning', 'Plumbing', 'Electrical', 'Salon at home', 'AC repair', 'Painting'];
  const cats = {};
  for (const name of catNames) {
    cats[name] = await Category.create({ name, slug: Category.slugify(name), isActive: name !== 'Painting' });
  }

  // ---------- Users ----------
  await makeUser('Admin User', 'admin@demo.com', 'admin');
  const priya = await makeUser('Priya Sharma', 'customer@demo.com', 'customer', '9876500001');
  const rahul = await makeUser('Rahul Mehta', 'rahul@demo.com', 'customer', '9876500002');

  const providerDefs = [
    { name: 'Arjun Rao', email: 'provider@demo.com', business: 'CoolFix Services', city: 'Bengaluru', exp: 6, status: 'approved', bio: 'AC servicing and repair for all major brands.' },
    { name: 'Kavya Nair', email: 'sparkle@demo.com', business: 'SparkleCare', city: 'Bengaluru', exp: 4, status: 'approved', bio: 'Deep cleaning for homes and offices.' },
    { name: 'Neha Kapoor', email: 'glow@demo.com', business: 'Glow Studio', city: 'Bengaluru', exp: 5, status: 'approved', bio: 'Salon services at your doorstep.' },
    { name: 'Imran Khan', email: 'pipeline@demo.com', business: 'PipeLine Pros', city: 'Bengaluru', exp: 8, status: 'approved', bio: 'Leak fixes, fittings and bathroom plumbing.' },
    { name: 'Suresh Kumar', email: 'brightspark@demo.com', business: 'BrightSpark Electricals', city: 'Bengaluru', exp: 8, status: 'pending', bio: 'Wiring, switchboards and fan installation.' },
    { name: 'Meera Iyer', email: 'freshnest@demo.com', business: 'FreshNest Cleaners', city: 'Mysuru', exp: 3, status: 'pending', bio: 'Eco-friendly cleaning.' },
  ];
  const providers = {};
  for (const def of providerDefs) {
    const user = await makeUser(def.name, def.email, 'provider');
    await ProviderProfile.create({ userId: user._id, businessName: def.business, city: def.city, experienceYears: def.exp, approvalStatus: def.status, bio: def.bio });
    await Availability.create({ providerId: user._id, slotIntervalMinutes: 60, weekly: Availability.defaultWeek() });
    providers[def.business] = user;
  }

  // ---------- Services ----------
  const svc = async (provider, category, title, price, durationMinutes, description) =>
    Service.create({ providerId: providers[provider]._id, categoryId: cats[category]._id, title, price, durationMinutes, description });

  const acService = await svc('CoolFix Services', 'AC repair', 'Split AC service', 599, 60, 'Filter and coil cleaning, gas pressure check, drain flush and cooling test.');
  const gasRefill = await svc('CoolFix Services', 'AC repair', 'AC gas refill', 2199, 120, 'Leak test and complete gas top-up.');
  await svc('CoolFix Services', 'AC repair', 'Window AC repair', 449, 60, 'Diagnosis and minor repair for window ACs.');
  const deepClean = await svc('SparkleCare', 'Cleaning', 'Full home deep cleaning', 2499, 240, 'Kitchen, bathrooms, floors, windows and furniture.');
  await svc('SparkleCare', 'Cleaning', 'Bathroom cleaning', 499, 60, 'Tiles, fittings and floor scrubbing.');
  const haircut = await svc('Glow Studio', 'Salon at home', 'Haircut & styling at home', 499, 60, 'Haircut, wash and blow-dry at home.');
  await svc('Glow Studio', 'Salon at home', 'Facial & cleanup', 899, 60, 'Skin-type based facial with cleanup.');
  const tapRepair = await svc('PipeLine Pros', 'Plumbing', 'Tap & leak repair', 349, 60, 'Fix dripping taps and small leaks.');
  await svc('BrightSpark Electricals', 'Electrical', 'Fan installation', 299, 60, 'Ceiling fan fitting and testing.');

  // ---------- Bookings ----------
  const book = async ({ customer, service, start, status, history, reviewed = false }) => {
    const providerId = service.providerId;
    return Booking.create({
      customerId: customer._id,
      providerId,
      serviceId: service._id,
      serviceTitle: service.title,
      price: service.price,
      durationMinutes: service.durationMinutes,
      startTime: start.toUTC().toJSDate(),
      endTime: start.plus({ minutes: service.durationMinutes }).toUTC().toJSDate(),
      address: '12, 4th Cross, Indiranagar, Bengaluru',
      status,
      reviewed,
      statusHistory: history.map(([s, role, note, hoursAgo]) => ({ status: s, byRole: role, note, at: DateTime.now().minus({ hours: hoursAgo }).toJSDate() })),
      slotKeys: buildSlotKeys(start.toUTC().toJSDate(), service.durationMinutes, 60),
    });
  };

  const done = await book({ customer: priya, service: haircut, start: at(-12, 17), status: 'completed', reviewed: true,
    history: [['pending', 'customer', 'Booking requested', 320], ['confirmed', 'provider', '', 318], ['completed', 'provider', '', 280]] });
  await Review.create({ bookingId: done._id, customerId: priya._id, providerId: haircut.providerId, serviceId: haircut._id, rating: 5, comment: 'Very professional and on time.' });

  await book({ customer: priya, service: acService, start: at(-5, 10), status: 'completed',
    history: [['pending', 'customer', 'Booking requested', 150], ['confirmed', 'provider', '', 149], ['completed', 'provider', '', 115]] });
  await book({ customer: priya, service: tapRepair, start: at(-16, 11), status: 'cancelled',
    history: [['pending', 'customer', 'Booking requested', 420], ['cancelled', 'customer', 'Plans changed', 400]] });
  await book({ customer: priya, service: acService, start: at(1, 10), status: 'confirmed',
    history: [['pending', 'customer', 'Booking requested', 3], ['confirmed', 'provider', '', 2]] });
  await book({ customer: priya, service: deepClean, start: at(3, 9), status: 'pending', history: [['pending', 'customer', 'Booking requested', 1]] });
  await book({ customer: rahul, service: gasRefill, start: at(2, 15), status: 'pending', history: [['pending', 'customer', 'Booking requested', 1]] });
  await book({ customer: rahul, service: acService, start: at(4, 11), status: 'pending', history: [['pending', 'customer', 'Booking requested', 2]] });
  await book({ customer: rahul, service: acService, start: at(-1, 14), status: 'confirmed',
    history: [['pending', 'customer', 'Booking requested', 48], ['confirmed', 'provider', '', 47]] });

  // a few more finished, reviewed jobs so the homepage testimonials have real data
  const reviewed = [
    [rahul, deepClean, -20, 9, 5, 'The team was on time and the kitchen looks brand new.'],
    [rahul, tapRepair, -9, 11, 4, 'Fixed the leak quickly and explained what was wrong.'],
    [priya, acService, -25, 15, 5, 'Booking took a minute and the AC is cooling properly again.'],
  ];
  for (const [customer, service, day, hour, rating, comment] of reviewed) {
    const b = await book({ customer, service, start: at(day, hour), status: 'completed', reviewed: true,
      history: [['pending', 'customer', 'Booking requested', -day * 24 + 30], ['confirmed', 'provider', '', -day * 24 + 28], ['completed', 'provider', '', -day * 24 - 3]] });
    await Review.create({ bookingId: b._id, customerId: customer._id, providerId: service.providerId, serviceId: service._id, rating, comment });
  }

  for (const p of Object.values(providers)) await refreshProviderRating(p._id);

  console.log('\nSeed complete. Demo logins (password for all: the SEED_PASSWORD from your .env):');
  console.log('  Admin     admin@demo.com');
  console.log('  Customer  customer@demo.com   (also rahul@demo.com)');
  console.log('  Provider  provider@demo.com   (CoolFix Services, approved)');
  console.log('  Pending   brightspark@demo.com, freshnest@demo.com (waiting for admin approval)\n');
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
