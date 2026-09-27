require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const tripRoutes = require('./routes/trip.routes');
const journeyDayRoutes = require('./routes/journeyDay.routes');
const importRoutes = require('./routes/import.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const googleReviewsRoutes = require('./routes/googleReviews.routes');
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

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'qarwaan-api' }));

app.use('/api/trips', tripRoutes);
app.use('/api/journey-days', journeyDayRoutes);
app.use('/api/import', importRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/google-reviews', googleReviewsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`QARWAAN API running on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
