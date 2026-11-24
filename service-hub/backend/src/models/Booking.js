const mongoose = require('mongoose');
const { STATUSES, ACTIVE_STATUSES } = require('../utils/bookingRules');

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byRole: { type: String, enum: ['customer', 'provider', 'admin', 'system'] },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    // Snapshot of the service at booking time, so later edits don't change old bookings
    serviceTitle: { type: String, required: true },
    price: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    startTime: { type: Date, required: true, index: true }, // stored in UTC
    endTime: { type: Date, required: true },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    statusHistory: { type: [historySchema], default: [] },
    cancelReason: { type: String, default: '' },
    slotKeys: { type: [String], required: true },
    slotLocked: { type: Boolean, default: true },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// THE double-booking guard: an active booking's grid cells must be unique per provider.
bookingSchema.index(
  { providerId: 1, slotKeys: 1 },
  { unique: true, partialFilterExpression: { slotLocked: true }, name: 'no_double_booking' }
);

bookingSchema.pre('validate', function setDerivedFields() {
  this.slotLocked = ACTIVE_STATUSES.includes(this.status);
  if (!this.code) {
    this.code = `SH-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }
});

bookingSchema.methods.applyStatus = function applyStatus(status, user, note = '') {
  this.status = status;
  this.statusHistory.push({ status, byUserId: user.id, byRole: user.role, note });
  if (status === 'cancelled' || status === 'rejected') this.cancelReason = note;
};

module.exports = mongoose.model('Booking', bookingSchema);
