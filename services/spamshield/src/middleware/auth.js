//**
 * Authentication middleware
 */

const { logger } = require('../utils/logger');

// Simple API key validation (in production, use a proper API key store)
const VALID_API_KEYS = new Map();

// Load admin API key from environment
if (process.env.ADMIN_API_KEY) {
  VALID_API_KEYS.set(process.env.ADMIN_API_KEY, {
    role: 'admin',
    name: 'admin',
    tier: 'premium',
  });
}

/**
 * Validate API key middleware
 */
function validateApiKey(req, res, next) {
  const apiKey = req.headers[process.env.API_KEY_HEADER || 'x-api-key'] ||
                 req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Include X-API-Key header.',
    });
  }

  // Check if it's a valid key
  const keyData = VALID_API_KEYS.get(apiKey);
  if (!keyData) {
    // In a real app, check against database
    // For MVP, we'll accept a simple check
    if (apiKey === process.env.ADMIN_API_KEY) {
      req.apiKey = { role: 'admin', tier: 'premium' };
      return next();
    }

    // Allow demo key for testing
    if (apiKey.startsWith('demo_')) {
      req.apiKey = { role: 'user', tier: 'basic', name: 'demo' };
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  req.apiKey = keyData;
  next();
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (!req.apiKey || req.apiKey.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
  next();
}

/**
 * Require premium tier
 */
function requirePremium(req, res, next) {
  if (!req.apiKey || !['premium', 'enterprise'].includes(req.apiKey.tier)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Premium subscription required',
    });
  }
  next();
}

module.exports = {
  validateApiKey,
  requireAdmin,
  requirePremium,
};