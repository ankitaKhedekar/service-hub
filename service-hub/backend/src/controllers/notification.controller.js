const { Notification } = require('../models');
const { ok } = require('../utils/respond');

exports.list = async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ userId: req.user.id, isRead: false }),
  ]);
  ok(res, { unread, items: items.map((n) => ({ id: n._id, type: n.type, message: n.message, link: n.link, isRead: n.isRead, createdAt: n.createdAt })) });
};

exports.markRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { isRead: true });
  ok(res, { ok: true });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
  ok(res, { ok: true });
};
