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
  // Production: Restrict to configured origins with credentials
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]
    .filter(Boolean)
    .flatMap((origin) => {
      try {
        const url = new URL(origin);
        const host = url.host;
        return [`https://${host}`, `http://${host}`];
      } catch {
        return [origin];
      }
    });

  const allowedOrigins = [
    ...configuredOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  corsOptions.origin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
