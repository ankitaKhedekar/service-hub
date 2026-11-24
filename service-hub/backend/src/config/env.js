require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';

function required(name) {
  const value = process.env[name];
  if (!value && nodeEnv !== 'test') {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

module.exports = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET') || 'test-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  cancelCutoffHours: Number(process.env.CANCEL_CUTOFF_HOURS ?? 2),
  bookingWindowDays: Number(process.env.BOOKING_WINDOW_DAYS ?? 30),
};
