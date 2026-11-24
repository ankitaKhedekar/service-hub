const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true, maxlength: 100 },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    city: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    approvalNote: { type: String, default: '' },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
