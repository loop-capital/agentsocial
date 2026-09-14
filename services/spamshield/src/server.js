/**
 * SpamShield Blocking Service
 * Real-time spam/fraud call and text blocking API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { healthCheck } = require('./middleware/healthCheck');

// Routes
const blockingRoutes = require('./routes/blocking');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const statsRoutes = require('./routes/stats');

// Services
const { initializeIntelligenceRefresh } = require('./services/intelligenceRefresh');
const { initializeCache } = require('./services/cache');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Static files for dashboard
app.use('/static', express.static(path.join(__dirname, '../public')));

// Health check endpoint (no auth required)
app.get('/health', healthCheck);

// API Routes
app.use('/api/v1/check', blockingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/stats', statsRoutes);

// Dashboard (simple HTML UI)
app.use('/', dashboardRoutes);

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'SpamShield Blocking API',
    version: '1.0.0',
    endpoints: {
      'POST /api/v1/check': 'Check a phone number for spam risk',
      'GET /api/v1/check/:number': 'Check a phone number (GET variant)',
      'POST /api/v1/check/batch': 'Batch check multiple numbers',
      'GET /api/v1/stats': 'Get blocking statistics',
      'GET /api/v1/stats/top-offenders': 'Get top spam numbers',
      'POST /api/v1/admin/override': 'Manually override block decision',
      'DELETE /api/v1/admin/override/:number': 'Remove manual override',
      'GET /api/v1/admin/overrides': 'List manual overrides',
    },
    documentation: '/docs/index.html'
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.path
  });
});

// Start server
async function startServer() {
  try {
    // Initialize cache connection
    await initializeCache();
    logger.info('Cache initialized');

    // Start intelligence refresh scheduler
    initializeIntelligenceRefresh();
    logger.info('Intelligence refresh scheduler initialized');

    app.listen(PORT, () => {
      logger.info(`SpamShield Blocking Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Dashboard available at: http://localhost:${PORT}/`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;