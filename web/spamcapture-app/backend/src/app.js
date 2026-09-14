/**
 * SpamCapture Backend API
 * Main application entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');
const errorHandler = require('./utils/errorHandler');

// Import routes
const reportRoutes = require('./routes/reports.routes');
const blocklistRoutes = require('./routes/blocklist.routes');
const userRoutes = require('./routes/user.routes');
const statsRoutes = require('./routes/stats.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'http://localhost:19006'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Anonymous-User-Id'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// Stricter rate limit for report submissions
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 reports per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Report limit exceeded. Please try again later.',
  },
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/reports', reportLimiter, reportRoutes);
app.use('/api/blocklist', blocklistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SpamCapture API',
    version: '1.0.0',
    description: 'Community-powered spam reporting and blocking API',
    documentation: '/api/docs',
    endpoints: {
      reports: '/api/reports',
      blocklist: '/api/blocklist',
      users: '/api/users',
      stats: '/api/stats',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 SpamCapture API server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
