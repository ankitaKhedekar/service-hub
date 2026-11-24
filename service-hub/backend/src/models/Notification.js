const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'info' },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.statics.notify = function notify(userId, message, { type = 'info', link = '' } = {}) {
  return this.create({ userId, message, type, link }).catch(() => null); // never break the main action
};

module.exports = mongoose.model('Notification', notificationSchema);
