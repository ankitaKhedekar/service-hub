const mongoose = require('mongoose');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    isOpen: { type: Boolean, default: false },
    start: { type: String, match: timeRegex, default: '09:00' },
    end: { type: String, match: timeRegex, default: '18:00' },
    breakStart: { type: String, match: timeRegex },
    breakEnd: { type: String, match: timeRegex },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slotIntervalMinutes: { type: Number, enum: [15, 30, 60], default: 60 },
    weekly: { type: [daySchema], default: [] },
    leaves: { type: [String], default: [] }, // 'YYYY-MM-DD' in the app timezone
  },
  { timestamps: true }
);

availabilitySchema.statics.defaultWeek = () =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    isOpen: day !== 0,
    start: '09:00',
    end: day === 6 ? '16:00' : '18:00',
    ...(day >= 1 && day <= 5 ? { breakStart: '13:00', breakEnd: '14:00' } : {}),
  }));

module.exports = mongoose.model('Availability', availabilitySchema);
