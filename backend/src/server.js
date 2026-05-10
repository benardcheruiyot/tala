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

// MANUAL CORS - Bypass npm cors library to ensure it NEVER fails
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    origin: req.get('origin'),
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
    }
  });
});

// Diagnostic endpoint for debugging CORS issues
app.get('/api/cors-check', (req, res) => {
  res.status(200).json({
    message: 'CORS is working correctly',
    requestOrigin: req.get('origin') || 'none',
    method: req.method,
    timestamp: new Date().toISOString(),
    yourCorsHeaders: {
      origin: res.getHeader('Access-Control-Allow-Origin'),
      methods: res.getHeader('Access-Control-Allow-Methods'),
      headers: res.getHeader('Access-Control-Allow-Headers'),
      credentials: res.getHeader('Access-Control-Allow-Credentials'),
    },
  });
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
