/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource',
    });
  }

  // Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Generic API errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'An error occurred',
    });
  }

  // Default server error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
};

module.exports = errorHandler;
