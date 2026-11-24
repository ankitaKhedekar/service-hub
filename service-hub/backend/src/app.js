const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { corsOrigins, nodeEnv } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const ApiError = require('./utils/ApiError');

const app = express();

app.set('trust proxy', 1); // correct client IPs behind Render/Railway proxies (needed for rate limiting)
app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    // allow tools like curl/Postman (no origin) and the configured frontends
    if (!origin || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new ApiError(403, `CORS: origin ${origin} is not allowed`));
  },
}));
app.use(express.json({ limit: '100kb' }));
if (nodeEnv !== 'test') app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => res.json({ success: true, data: { name: 'Service Hub API', docs: '/api/health' } }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
