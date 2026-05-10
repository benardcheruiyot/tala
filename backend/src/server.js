require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const pushService = require('./services/pushService');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - BULLETPROOF VERSION
const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  credentials: true,
};

if (isDevelopment) {
  // Development: Allow ALL origins
  corsOptions.origin = true;
  corsOptions.credentials = false;
} else {
  // Production: Strict whitelist
  const productionOrigins = [
    'https://tala.mkopaji.com',
    'http://tala.mkopaji.com',
    'https://www.tala.mkopaji.com',
    'http://www.tala.mkopaji.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ];

  corsOptions.origin = (origin, callback) => {
    // Log all origins for debugging
    if (origin) {
      console.log(`[CORS] Origin request: ${origin}`);
    }
    
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) {
      console.log('[CORS] No origin header - allowing');
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (productionOrigins.includes(origin)) {
      console.log(`[CORS] ✓ Origin allowed: ${origin}`);
      return callback(null, true);
    }

    // If origin is a variant, try to normalize and check again
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    const normalizedWhitelist = productionOrigins.map(o => o.toLowerCase().replace(/\/$/, ''));
    
    if (normalizedWhitelist.includes(normalizedOrigin)) {
      console.log(`[CORS] ✓ Origin allowed (normalized): ${origin}`);
      return callback(null, true);
    }

    console.error(`[CORS] ✗ Blocked origin: ${origin}`);
    console.error(`[CORS] Allowed origins: ${productionOrigins.join(', ')}`);
    callback(new Error(`CORS policy: Origin not allowed`));
  };
}

app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

  // Configure Web Push VAPID
  pushService.configure();
  console.log('🔔 Web Push configured');

  // Hourly push notification scheduler
  setInterval(() => {
    pushService.broadcastHourlyReminder();
  }, 60 * 60 * 1000); // every 60 minutes
});

module.exports = server;
