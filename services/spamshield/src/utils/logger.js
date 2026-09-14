/**
 * Winston logger configuration
 */

const winston = require('winston');

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine log format based on environment
const logFormat = process.env.LOG_FORMAT === 'json' || process.env.NODE_ENV === 'production'
  ? combine(timestamp(), json(), errors({ stack: true }))
  : combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      devFormat
    );

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'spamshield' },
  format: logFormat,
  transports: [
    new winston.transports.Console(),
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
  }));
}

module.exports = { logger };