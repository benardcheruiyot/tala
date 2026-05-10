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

// CORS configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

if (isDevelopment) {
  // Development: Allow all origins without credentials
  corsOptions.origin = '*';
  corsOptions.credentials = false;
} else {
  // Production: Build allowed origins list
  const baseOrigins = [
    process.env.FRONTEND_URL || 'https://tala.mkopaji.com',
    ...(process.env.FRONTEND_URLS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  // Expand each origin to include both http and https versions
  const allowedOriginsList = baseOrigins.flatMap((origin) => {
    const origins = [origin];
    
    // If only domain given, add both http and https
    if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
      origins.push(`https://${origin}`);
      origins.push(`http://${origin}`);
    }
    
    // If https://, also add http://
    if (origin.startsWith('https://')) {
      const domain = origin.replace('https://', '');
      origins.push(`http://${domain}`);
    }
    
    return origins;
  }).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  corsOptions.origin = (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests
    if (allowedOriginsList.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS] Blocked origin: ${origin}. Allowed: ${allowedOriginsList.join(', ')}`);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  };
  corsOptions.credentials = true;
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
