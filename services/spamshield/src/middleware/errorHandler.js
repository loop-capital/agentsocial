/**
 * Error handling middleware
 */

const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed',
    });
  }

  if (err.code === '28P01') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database authentication failed',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };