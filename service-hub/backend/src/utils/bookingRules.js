// Booking status rules: which status can move to which, and who may move it.
// Kept free of database code so it can be unit tested on its own.

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show'];
const ACTIVE_STATUSES = ['pending', 'confirmed']; // these hold (lock) the time slot

const TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  rejected: [],
  no_show: [],
};

const PROVIDER_ALLOWED = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['completed', 'no_show', 'cancelled'],
};

/**
 * Decide whether `user` may move `booking` to status `to`.
 * Returns { allowed: true } or { allowed: false, status, reason }.
 */
function checkTransition({ user, booking, to, now = new Date(), cancelCutoffHours = 2 }) {
  const from = booking.status;
  const deny = (status, reason) => ({ allowed: false, status, reason });

  if (!STATUSES.includes(to)) return deny(400, `Unknown status "${to}"`);
  if (!TRANSITIONS[from] || !TRANSITIONS[from].includes(to)) {
    return deny(400, `A ${from} booking cannot be changed to ${to}`);
  }

  const userId = String(user.id);
  const start = new Date(booking.startTime);

  if (user.role === 'customer') {
    if (String(booking.customerId) !== userId) return deny(403, 'This is not your booking');
    if (to !== 'cancelled') return deny(403, 'Customers can only cancel a booking');
    const hoursLeft = (start - now) / 36e5;
    if (hoursLeft < cancelCutoffHours) {
      return deny(400, `Bookings can only be cancelled up to ${cancelCutoffHours} hours before the slot`);
    }
  } else if (user.role === 'provider') {
    if (String(booking.providerId) !== userId) return deny(403, 'This booking is not for your services');
    if (!(PROVIDER_ALLOWED[from] || []).includes(to)) return deny(403, `Providers cannot change a ${from} booking to ${to}`);
  } else if (user.role !== 'admin') {
    return deny(403, 'Not allowed');
  }

  if ((to === 'completed' || to === 'no_show') && start > now) {
    return deny(400, `A booking can only be marked ${to === 'completed' ? 'completed' : 'no-show'} after its start time`);
  }

  return { allowed: true };
}

module.exports = { STATUSES, ACTIVE_STATUSES, TRANSITIONS, checkTransition };
