const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

// Checks the Bearer token and loads the user. The role always comes from the database, never from the client.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized();
  if (!user.isActive) throw ApiError.forbidden('Your account has been blocked. Contact support');

  req.user = { id: String(user._id), role: user.role, name: user.name, email: user.email };
  next();
});

// Usage: authorize('admin') or authorize('provider', 'admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

module.exports = { signToken, authenticate, authorize };
