const { User, ProviderProfile, Availability } = require('../models');
const { signToken } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

async function buildSession(user) {
  const data = { token: signToken(user), user: user.toPublic() };
  if (user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ userId: user._id }).lean();
    data.user.approvalStatus = profile ? profile.approvalStatus : 'pending';
  }
  return data;
}

exports.register = async (req, res) => {
  const { name, email, phone, password, role, businessName, city } = req.body;
  if (await User.exists({ email: email.toLowerCase() })) throw ApiError.conflict('An account with this email already exists');

  const user = new User({ name, email, phone, role });
  await user.setPassword(password);
  await user.save();

  if (role === 'provider') {
    await ProviderProfile.create({ userId: user._id, businessName, city: city || '' });
    await Availability.create({ providerId: user._id, weekly: Availability.defaultWeek() });
  }

  ok(res, await buildSession(user), 201);
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  // Same message for wrong email and wrong password, so attackers can't find valid emails
  if (!user || !(await user.checkPassword(req.body.password))) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Your account has been blocked. Contact support');
  ok(res, await buildSession(user));
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  const data = user.toPublic();
  if (user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ userId: user._id }).lean();
    data.approvalStatus = profile ? profile.approvalStatus : 'pending';
  }
  ok(res, data);
};
