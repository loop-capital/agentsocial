/**
 * Validation utilities
 */

const { validationResult } = require('express-validator');

/**
 * Express middleware to validate request data
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Sanitize phone number to a standard format
 */
const sanitizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-numeric characters except +
  let sanitized = phone.replace(/[^0-9+]/g, '');
  
  // Remove leading +1 for US numbers if present
  if (sanitized.startsWith('+1') && sanitized.length === 12) {
    sanitized = sanitized.substring(2);
  }
  
  // Remove leading 1 for US numbers if present
  if (sanitized.startsWith('1') && sanitized.length === 11) {
    sanitized = sanitized.substring(1);
  }
  
  return sanitized;
};

/**
 * Validate phone number format
 */
const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  
  // Basic international format check
  const phoneRegex = /^(\+?[1-9]\d{1,14}|[1-9]\d{9,14})$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''));
};

/**
 * Sanitize text content to prevent XSS
 */
const sanitizeContent = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate UUID format
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

module.exports = {
  validate,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  sanitizeContent,
  isValidUUID,
};
