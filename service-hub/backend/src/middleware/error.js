const ApiError = require('../utils/ApiError');
const { isProd } = require('../config/env');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let { details } = err;

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Please check the highlighted fields';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || {});
    if (fields.includes('slotKeys')) message = 'Sorry, this slot was just booked. Please pick another time';
    else if (fields.includes('email')) message = 'An account with this email already exists';
    else message = `Duplicate value for ${fields.join(', ')}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (isProd) message = 'Something went wrong. Please try again';
  }

  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}

module.exports = { notFound, errorHandler };
