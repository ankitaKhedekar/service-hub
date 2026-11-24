// Full API tests against a real in-memory MongoDB (downloaded automatically the first time).
// Run: npm test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'unused';

const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { DateTime } = require('luxon');
const { connectDB, disconnectDB } = require('../../src/config/db');
const app = require('../../src/app');
const { User, Availability } = require('../../src/models');

let mongo;
const api = () => request(app);

async function register(body) {
  const res = await api().post('/api/auth/register').send({ password: 'Passw0rd!', ...body });
  return res;
}

async function login(email) {
  const res = await api().post('/api/auth/login').send({ email, password: 'Passw0rd!' });
  return res.body.data.token;
}

/** Next Monday 10:00 IST - always a valid future slot with the default week. */
function nextMondayAt(hour) {
  let d = DateTime.now().setZone('Asia/Kolkata').startOf('day').plus({ days: 1 });
  while (d.weekday !== 1) d = d.plus({ days: 1 });
  return d.set({ hour });
}

let adminToken; let providerToken; let customerToken; let customer2Token; let serviceId; let providerId;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDB(mongo.getUri());

  // admin cannot self-register, so create directly
  const admin = new User({ name: 'Admin', email: 'admin@test.com', role: 'admin' });
  await admin.setPassword('Passw0rd!');
  await admin.save();
  adminToken = await login('admin@test.com');

  const p = await register({ name: 'Pro', email: 'pro@test.com', role: 'provider', businessName: 'Pro Fixers', city: 'Bengaluru' });
  providerId = p.body.data.user.id;
  providerToken = p.body.data.token;
  customerToken = (await register({ name: 'Cust', email: 'cust@test.com' })).body.data.token;
  customer2Token = (await register({ name: 'Cust Two', email: 'cust2@test.com' })).body.data.token;
});

afterAll(async () => {
  await disconnectDB();
  if (mongo) await mongo.stop();
});

describe('auth and roles', () => {
  test('cannot register as admin', async () => {
    const res = await register({ name: 'Evil', email: 'evil@test.com', role: 'admin' });
    expect(res.status).toBe(400);
  });

  test('duplicate email is rejected', async () => {
    const res = await register({ name: 'Cust', email: 'cust@test.com' });
    expect(res.status).toBe(409);
  });

  test('wrong password gives a generic error', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'cust@test.com', password: 'nope12345' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('customer cannot open admin routes', async () => {
    const res = await api().get('/api/admin/stats').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('no token means 401', async () => {
    expect((await api().get('/api/bookings/my')).status).toBe(401);
  });
});

describe('provider onboarding', () => {
  test('admin creates a category and approves the provider; provider adds a service', async () => {
    const cat = await api().post('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'AC repair' });
    expect(cat.status).toBe(201);

    const svc = await api().post('/api/provider/services').set('Authorization', `Bearer ${providerToken}`)
      .send({ categoryId: cat.body.data.id, title: 'Split AC service', price: 599, durationMinutes: 60 });
    expect(svc.status).toBe(201);
    serviceId = svc.body.data.id;

    // hidden until approved
    expect((await api().get(`/api/services/${serviceId}`)).status).toBe(404);

    const ap = await api().patch(`/api/admin/providers/${providerId}/approval`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });
    expect(ap.status).toBe(200);
    expect((await api().get(`/api/services/${serviceId}`)).status).toBe(200);
  });
});

describe('booking flow', () => {
  let bookingId;
  const start = nextMondayAt(10);

  test('slots are listed for a date', async () => {
    const res = await api().get(`/api/services/${serviceId}/slots`).query({ date: start.toISODate() });
    expect(res.status).toBe(200);
    expect(res.body.data.slots.find((s) => s.label === '10:00 AM').available).toBe(true);
  });

  test('customer books a slot -> pending', async () => {
    const res = await api().post('/api/bookings').set('Authorization', `Bearer ${customerToken}`)
      .send({ serviceId, startTime: start.toISO(), address: '12 MG Road, Bengaluru' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    bookingId = res.body.data.id;
  });

  test('the same slot cannot be booked again', async () => {
    const res = await api().post('/api/bookings').set('Authorization', `Bearer ${customer2Token}`)
      .send({ serviceId, startTime: start.toISO(), address: '5 Park Street, Bengaluru' });
    expect(res.status).toBe(409);
  });

  test('two customers racing for one slot: exactly one wins', async () => {
    const raceStart = nextMondayAt(15).toISO();
    const [a, b] = await Promise.all([
      api().post('/api/bookings').set('Authorization', `Bearer ${customerToken}`).send({ serviceId, startTime: raceStart, address: 'Address one, Bengaluru' }),
      api().post('/api/bookings').set('Authorization', `Bearer ${customer2Token}`).send({ serviceId, startTime: raceStart, address: 'Address two, Bengaluru' }),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });

  test('a time that is not a slot is rejected', async () => {
    const res = await api().post('/api/bookings').set('Authorization', `Bearer ${customerToken}`)
      .send({ serviceId, startTime: nextMondayAt(13).toISO(), address: '12 MG Road, Bengaluru' }); // lunch break
    expect(res.status).toBe(400);
  });

  test('provider cannot be the one booking', async () => {
    const res = await api().post('/api/bookings').set('Authorization', `Bearer ${providerToken}`)
      .send({ serviceId, startTime: nextMondayAt(16).toISO(), address: '12 MG Road, Bengaluru' });
    expect(res.status).toBe(403);
  });

  test('provider confirms, customer sees the new status and history', async () => {
    const res = await api().patch(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${providerToken}`).send({ status: 'confirmed' });
    expect(res.status).toBe(200);

    const mine = await api().get('/api/bookings/my').set('Authorization', `Bearer ${customerToken}`);
    const b = mine.body.data.find((x) => x.id === bookingId);
    expect(b.status).toBe('confirmed');
    expect(b.statusHistory.map((h) => h.status)).toEqual(['pending', 'confirmed']);
  });

  test("another customer cannot see or cancel this booking", async () => {
    expect((await api().get(`/api/bookings/${bookingId}`).set('Authorization', `Bearer ${customer2Token}`)).status).toBe(404);
    expect((await api().patch(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${customer2Token}`).send({ status: 'cancelled' })).status).toBe(404);
  });

  test('cannot complete before the start time', async () => {
    const res = await api().patch(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${providerToken}`).send({ status: 'completed' });
    expect(res.status).toBe(400);
  });

  test('cancelling frees the slot for others', async () => {
    const res = await api().patch(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${customerToken}`).send({ status: 'cancelled', note: 'Plans changed' });
    expect(res.status).toBe(200);
    const again = await api().post('/api/bookings').set('Authorization', `Bearer ${customer2Token}`)
      .send({ serviceId, startTime: start.toISO(), address: '5 Park Street, Bengaluru' });
    expect(again.status).toBe(201);
  });

  test('leave days have no slots', async () => {
    const leave = nextMondayAt(10).plus({ days: 1 }).toISODate();
    const av = await Availability.findOne({ providerId }).lean();
    const put = await api().put('/api/provider/availability').set('Authorization', `Bearer ${providerToken}`)
      .send({ slotIntervalMinutes: 60, weekly: av.weekly, leaves: [leave] });
    expect(put.status).toBe(200);
    const res = await api().get(`/api/services/${serviceId}/slots`).query({ date: leave });
    expect(res.body.data.slots).toEqual([]);
  });
});

describe('admin', () => {
  test('stats and booking list work', async () => {
    const stats = await api().get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalBookings).toBeGreaterThan(0);
    const list = await api().get('/api/admin/bookings').set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  test('blocked users cannot log in', async () => {
    const users = await api().get('/api/admin/users').query({ q: 'cust2' }).set('Authorization', `Bearer ${adminToken}`);
    const id = users.body.data[0].id;
    await api().patch(`/api/admin/users/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ isActive: false });
    const res = await api().post('/api/auth/login').send({ email: 'cust2@test.com', password: 'Passw0rd!' });
    expect(res.status).toBe(403);
  });
});

describe('public website endpoints', () => {
  test('stats and reviews are public', async () => {
    const stats = await api().get('/api/site/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.data).toHaveProperty('providers');
    expect((await api().get('/api/site/reviews')).status).toBe(200);
  });

  test('newsletter signup is idempotent', async () => {
    expect((await api().post('/api/site/newsletter').send({ email: 'Fan@Test.com' })).status).toBe(201);
    expect((await api().post('/api/site/newsletter').send({ email: 'fan@test.com' })).status).toBe(201);
    expect((await api().post('/api/site/newsletter').send({ email: 'not-an-email' })).status).toBe(400);
  });

  test('contact form validates, blocks bots, and shows in admin', async () => {
    expect((await api().post('/api/site/contact').send({ name: 'A', email: 'a@b.com', message: 'short' })).status).toBe(400);
    expect((await api().post('/api/site/contact').send({ name: 'Bot', email: 'bot@b.com', message: 'Buy cheap things now!!', website: 'spam.com' })).status).toBe(400);
    const okRes = await api().post('/api/site/contact').send({ name: 'Asha', email: 'asha@b.com', topic: 'provider', message: 'How do I list my salon?' });
    expect(okRes.status).toBe(201);
    const list = await api().get('/api/admin/messages').set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.data[0].name).toBe('Asha');
    expect((await api().get('/api/admin/messages').set('Authorization', `Bearer ${customerToken}`)).status).toBe(403);
  });
});
