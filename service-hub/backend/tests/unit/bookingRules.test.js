const { checkTransition } = require('../../src/utils/bookingRules');

const now = new Date('2030-01-07T00:00:00Z');
const future = new Date('2030-01-08T05:00:00Z');
const past = new Date('2030-01-06T05:00:00Z');
const customer = { id: 'c1', role: 'customer' };
const provider = { id: 'p1', role: 'provider' };
const admin = { id: 'a1', role: 'admin' };
const booking = (status, startTime = future) => ({ status, startTime, customerId: 'c1', providerId: 'p1' });

describe('checkTransition', () => {
  test('provider can confirm or reject a pending booking', () => {
    expect(checkTransition({ user: provider, booking: booking('pending'), to: 'confirmed', now }).allowed).toBe(true);
    expect(checkTransition({ user: provider, booking: booking('pending'), to: 'rejected', now }).allowed).toBe(true);
  });

  test("provider cannot touch another provider's booking", () => {
    const r = checkTransition({ user: { id: 'p2', role: 'provider' }, booking: booking('pending'), to: 'confirmed', now });
    expect(r).toMatchObject({ allowed: false, status: 403 });
  });

  test('customer can only cancel, and only before the cutoff', () => {
    expect(checkTransition({ user: customer, booking: booking('confirmed'), to: 'cancelled', now }).allowed).toBe(true);
    expect(checkTransition({ user: customer, booking: booking('pending'), to: 'confirmed', now }).status).toBe(403);
    const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour away
    expect(checkTransition({ user: customer, booking: booking('confirmed', soon), to: 'cancelled', now, cancelCutoffHours: 2 }).status).toBe(400);
  });

  test("customer cannot cancel someone else's booking", () => {
    expect(checkTransition({ user: { id: 'c2', role: 'customer' }, booking: booking('pending'), to: 'cancelled', now }).status).toBe(403);
  });

  test('completed only after the start time', () => {
    expect(checkTransition({ user: provider, booking: booking('confirmed', future), to: 'completed', now }).status).toBe(400);
    expect(checkTransition({ user: provider, booking: booking('confirmed', past), to: 'completed', now }).allowed).toBe(true);
  });

  test('finished bookings cannot change', () => {
    expect(checkTransition({ user: admin, booking: booking('completed', past), to: 'cancelled', now }).status).toBe(400);
    expect(checkTransition({ user: admin, booking: booking('cancelled'), to: 'confirmed', now }).status).toBe(400);
  });

  test('admin can move any active booking along valid paths', () => {
    expect(checkTransition({ user: admin, booking: booking('pending'), to: 'cancelled', now }).allowed).toBe(true);
    expect(checkTransition({ user: admin, booking: booking('confirmed', past), to: 'no_show', now }).allowed).toBe(true);
  });
});
