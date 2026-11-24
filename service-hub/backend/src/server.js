const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');

async function start() {
  try {
    await connectDB(env.mongoUri);
    console.log('MongoDB connected');
    app.listen(env.port, () => console.log(`Service Hub API running on http://localhost:${env.port}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
