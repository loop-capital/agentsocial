/**
 * Blocking API routes
 * Real-time spam/fraud checking endpoints
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const { logger } = require('../utils/logger');
const { validatePhoneNumber, normalizeForLookup } = require('../utils/phoneValidator');
const { calculateRiskScore } = require('../utils/riskScorer');
const { 
  getPhoneNumberData, 
  getOverride, 
  logCheckEvent 
} = require('../utils/database');
const { 
  getCache, 
  setCache, 
  getPhoneCacheKey 
} = require('../services/cache');
const { validateApiKey, requirePremium } = require('../middleware/auth');

/**
 * POST /api/v1/check
 * Check a single phone number for spam risk
 */
router.post('/',
  validateApiKey,
  [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('phoneNumber is required')
      .custom((value) => {
        const result = validatePhoneNumber(value);
        if (!result.valid) {
          throw new Error(result.error);
        }
        return true;
      }),
    body('context')
      .optional()
      .isIn(['call', 'text', 'sms', 'unknown'])
      .withMessage('context must be call, text, sms, or unknown'),
    body('sensitivity')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('sensitivity must be low, medium, or high'),
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
        });
      }

      const { phoneNumber, context = 'unknown', sensitivity } = req.body;

      // Normalize the phone number
      const normalized = normalizeForLookup(phoneNumber);
      if (!normalized) {
        return res.status(400).json({
          error: 'Invalid Phone Number',
          message: 'Could not normalize phone number',
        });
      }

      // Determine sensitivity based on tier
      const effectiveSensitivity = sensitivity || 
        (req.apiKey?.tier === 'premium' ? 'high' : 'medium');

      // Check cache first
      const cacheKey = getPhoneCacheKey(normalized, effectiveSensitivity);
      const cached = await getCache(cacheKey);
      
      if (cached) {
        logger.debug('Cache hit for phone check', { phoneNumber: normalized });
        cached.cached = true;
        
        // Log the check event
        await logCheckEvent(normalized, cached, req.apiKey?.name, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        return res.json({
          success: true,
          data: cached,
        });
      }

      // Check for manual override
      const override = await getOverride(normalized);
      if (override) {
        const overrideResult = {
          phoneNumber: normalized,
          score: override.decision === 'block' ? 100 : 0,
          level: override.decision === 'block' ? 'critical' : 'safe',
          recommendation: override.decision === 'block' ? 'BLOCK' : 'SAFE',
          action: override.decision === 'block' ? 'block_all' : 'allow',
          override: true,
          overrideReason: override.reason,
          sensitivity: effectiveSensitivity,
          factors: [],
          metadata: {
            totalReports: 0,
            overrideBy: override.created_by,
            overrideAt: override.created_at,
          },
        };

        // Cache override result
        await setCache(cacheKey, overrideResult, 600);

        await logCheckEvent(normalized, overrideResult, req.apiKey?.name, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        return res.json({
          success: true,
          data: overrideResult,
        });
      }

      // Get report data from database
      const reportData = await getPhoneNumberData(normalized);

      // Calculate risk score
      const riskResult = calculateRiskScore(reportData, {
        sensitivity: effectiveSensitivity,
        context: context === 'sms' ? 'text' : context,
      });

      // Add phone number to result
      const result = {
        phoneNumber: normalized,
        ...riskResult,
        cached: false,
      };

      // Cache the result (TTL based on risk level)
      const cacheTtl = result.level === 'critical' ? 600 : 
                       result.level === 'high' ? 300 : 60;
      await setCache(cacheKey, result, cacheTtl);

      // Log the check event
      await logCheckEvent(normalized, result, req.apiKey?.name, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/check/:number
 * Check a phone number via URL parameter
 */
router.get('/:number',
  validateApiKey,
  [
    param('number')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
        });
      }

      const { number } = req.params;
      const { context = 'unknown', sensitivity } = req.query;

      // Forward to same logic as POST
      req.body = { phoneNumber: number, context, sensitivity };
      
      // Re-use POST handler logic
      const normalized = normalizeForLookup(number);
      if (!normalized) {
        return res.status(400).json({
          error: 'Invalid Phone Number',
          message: 'Could not normalize phone number',
        });
      }

      const effectiveSensitivity = sensitivity || 
        (req.apiKey?.tier === 'premium' ? 'high' : 'medium');

      // Check cache
      const cacheKey = getPhoneCacheKey(normalized, effectiveSensitivity);
      const cached = await getCache(cacheKey);
      
      if (cached) {
        cached.cached = true;
        await logCheckEvent(normalized, cached, req.apiKey?.name, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.json({ success: true, data: cached });
      }

      // Check override
      const override = await getOverride(normalized);
      if (override) {
        const overrideResult = {
          phoneNumber: normalized,
          score: override.decision === 'block' ? 100 : 0,
          level: override.decision === 'block' ? 'critical' : 'safe',
          recommendation: override.decision === 'block' ? 'BLOCK' : 'SAFE',
          action: override.decision === 'block' ? 'block_all' : 'allow',
          override: true,
          overrideReason: override.reason,
          sensitivity: effectiveSensitivity,
          factors: [],
          metadata: { totalReports: 0 },
        };
        await setCache(cacheKey, overrideResult, 600);
        await logCheckEvent(normalized, overrideResult, req.apiKey?.name, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.json({ success: true, data: overrideResult });
      }

      // Get data and calculate risk
      const reportData = await getPhoneNumberData(normalized);
      const riskResult = calculateRiskScore(reportData, {
        sensitivity: effectiveSensitivity,
        context: context === 'sms' ? 'text' : context,
      });

      const result = {
        phoneNumber: normalized,
        ...riskResult,
        cached: false,
      };

      const cacheTtl = result.level === 'critical' ? 600 : 
                       result.level === 'high' ? 300 : 60;
      await setCache(cacheKey, result, cacheTtl);

      await logCheckEvent(normalized, result, req.apiKey?.name, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true, data: result });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/check/batch
 * Batch check multiple phone numbers (premium feature)
 */
router.post('/batch',
  validateApiKey,
  requirePremium,
  [
    body('phoneNumbers')
      .isArray({ min: 1, max: 100 })
      .withMessage('phoneNumbers must be an array (1-100 items)'),
    body('phoneNumbers.*')
      .isString()
      .withMessage('Each phone number must be a string'),
    body('context')
      .optional()
      .isIn(['call', 'text', 'sms', 'unknown']),
    body('sensitivity')
      .optional()
      .isIn(['low', 'medium', 'high']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
        });
      }

      const { phoneNumbers, context = 'unknown', sensitivity } = req.body;
      const effectiveSensitivity = sensitivity || 'high';

      const results = [];
      const errors_list = [];

      // Process each number
      for (const phone of phoneNumbers) {
        const normalized = normalizeForLookup(phone);
        
        if (!normalized) {
          errors_list.push({ phone, error: 'Invalid phone number' });
          continue;
        }

        try {
          const cacheKey = getPhoneCacheKey(normalized, effectiveSensitivity);
          const cached = await getCache(cacheKey);
          
          if (cached) {
            results.push({ ...cached, cached: true });
            continue;
          }

          const reportData = await getPhoneNumberData(normalized);
          const riskResult = calculateRiskScore(reportData, {
            sensitivity: effectiveSensitivity,
            context: context === 'sms' ? 'text' : context,
          });

          const result = {
            phoneNumber: normalized,
            ...riskResult,
            cached: false,
          };

          const cacheTtl = result.level === 'critical' ? 600 : 
                           result.level === 'high' ? 300 : 60;
          await setCache(cacheKey, result, cacheTtl);

          results.push(result);

        } catch (err) {
          errors_list.push({ phone: normalized, error: err.message });
        }
      }

      res.json({
        success: true,
        data: {
          checked: results.length,
          errors: errors_list.length,
          results,
          errors: errors_list,
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;