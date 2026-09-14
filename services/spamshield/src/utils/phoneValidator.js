/**
 * Phone number validation utilities using libphonenumber-js
 */

const { parsePhoneNumberFromString, isValidPhoneNumber } = require('libphonenumber-js');

/**
 * Validate and normalize phone number to E.164 format
 * @param {string} phoneNumber - Phone number to validate
 * @param {string} defaultCountry - Default country code (ISO 3166-1 alpha-2)
 * @returns {object} Validation result with normalized number
 */
function validatePhoneNumber(phoneNumber, defaultCountry = 'US') {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      valid: false,
      error: 'Phone number is required',
    };
  }

  // Remove common formatting characters
  const cleaned = phoneNumber.replace(/[\s\-\.\(\)]/g, '');

  try {
    const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);

    if (!parsed) {
      return {
        valid: false,
        error: 'Invalid phone number format',
        original: phoneNumber,
      };
    }

    if (!parsed.isValid()) {
      return {
        valid: false,
        error: 'Phone number is not valid',
        original: phoneNumber,
        country: parsed.country,
      };
    }

    return {
      valid: true,
      e164: parsed.format('E.164'),
      national: parsed.formatNational(),
      international: parsed.formatInternational(),
      country: parsed.country,
      countryCallingCode: parsed.countryCallingCode,
      type: parsed.getType(), // 'MOBILE', 'FIXED_LINE', etc.
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to parse phone number',
      original: phoneNumber,
    };
  }
}

/**
 * Check if a string looks like a phone number (basic check)
 * @param {string} input - Input to check
 * @returns {boolean}
 */
function looksLikePhoneNumber(input) {
  if (!input || typeof input !== 'string') return false;
  
  // Remove formatting and check if it's mostly digits
  const digits = input.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Normalize phone number for database lookup
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string|null} Normalized number or null
 */
function normalizeForLookup(phoneNumber) {
  const result = validatePhoneNumber(phoneNumber);
  return result.valid ? result.e164 : null;
}

/**
 * Extract country from phone number
 * @param {string} phoneNumber - Phone number
 * @returns {string|null} Country code or null
 */
function getCountryFromNumber(phoneNumber) {
  const result = validatePhoneNumber(phoneNumber);
  return result.valid ? result.country : null;
}

module.exports = {
  validatePhoneNumber,
  looksLikePhoneNumber,
  normalizeForLookup,
  getCountryFromNumber,
};