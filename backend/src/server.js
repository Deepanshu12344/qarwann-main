const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const tripRoutes = require('./routes/trip.routes');
const journeyDayRoutes = require('./routes/journeyDay.routes');
const importRoutes = require('./routes/import.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const googleReviewsRoutes = require('./routes/googleReviews.routes');
const aiTravelRoutes = require('./routes/aiTravel.routes');
const uploadRoutes = require('./routes/upload.routes');
const { notFound, errorHandler } = require('./middleware/error');
const { getAllowedOrigins, getJwtSecret } = require('./config/security');

const app = express();

if (process.env.NODE_ENV === 'production') getJwtSecret();

app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false, // This JSON API serves no browser document; the frontend sets its own CSP.
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'no-referrer' },
}));
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 600,
}));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'qarwaan-api',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/trips', tripRoutes);
app.use('/api/public/trips', tripRoutes);
app.use('/api/journey-days', journeyDayRoutes);
app.use('/api/import', importRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/google-reviews', googleReviewsRoutes);
app.use('/api/ai', aiTravelRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.warn('MongoDB connection failed or not running; running with in-memory catalogue fallback:', err.message);
  })
  .finally(() => {
    app.listen(PORT, () => console.log(`QARWAAN API running on :${PORT}`));
  });
