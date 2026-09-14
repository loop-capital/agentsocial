/**
 * Admin API routes
 * Manual overrides and administration
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');

const { logger } = require('../utils/logger');
const { normalizeForLookup } = require('../utils/phoneValidator');
const { 
  addOverride, 
  removeOverride, 
  getAllOverrides,
  getCheckStats 
} = require('../utils/database');
const { invalidatePhoneCache } = require('../services/cache');
const { validateApiKey, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/v1/admin/override
 * Manually override block decision for a phone number
 */
router.post('/override',
  validateApiKey,
  requireAdmin,
  [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('phoneNumber is required'),
    body('decision')
      .notEmpty()
      .isIn(['block', 'allow'])
      .withMessage('decision must be "block" or "allow"'),
    body('reason')
      .trim()
      .notEmpty()
      .isLength({ min: 5, max: 500 })
      .withMessage('reason is required (5-500 characters)'),
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

      const { phoneNumber, decision, reason } = req.body;
      const adminId = req.apiKey?.name || 'unknown';

      // Normalize phone number
      const normalized = normalizeForLookup(phoneNumber);
      if (!normalized) {
        return res.status(400).json({
          error: 'Invalid Phone Number',
          message: 'Could not normalize phone number',
        });
      }

      // Add the override
      const override = await addOverride(normalized, decision, reason, adminId);

      // Invalidate cache for this number
      await invalidatePhoneCache(normalized);

      logger.info('Manual override added', {
        phoneNumber: normalized,
        decision,
        adminId,
      });

      res.json({
        success: true,
        data: {
          override,
          message: `Phone number ${normalized} has been manually set to ${decision}`,
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/admin/override/:number
 * Remove manual override for a phone number
 */
router.delete('/override/:number',
  validateApiKey,
  requireAdmin,
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
      const normalized = normalizeForLookup(number);

      if (!normalized) {
        return res.status(400).json({
          error: 'Invalid Phone Number',
          message: 'Could not normalize phone number',
        });
      }

      const removed = await removeOverride(normalized);

      if (!removed) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No override found for this phone number',
        });
      }

      // Invalidate cache
      await invalidatePhoneCache(normalized);

      logger.info('Manual override removed', {
        phoneNumber: normalized,
        adminId: req.apiKey?.name,
      });

      res.json({
        success: true,
        data: {
          removed: true,
          phoneNumber: normalized,
          message: `Override removed for ${normalized}`,
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/overrides
 * List all manual overrides
 */
router.get('/overrides',
  validateApiKey,
  requireAdmin,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 500 })
      .toInt(),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt(),
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

      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const overrides = await getAllOverrides(limit, offset);

      res.json({
        success: true,
        data: {
          overrides,
          count: overrides.length,
          limit,
          offset,
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/check-stats
 * Get API check statistics (last 24 hours)
 */
router.get('/check-stats',
  validateApiKey,
  requireAdmin,
  async (req, res, next) => {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const stats = await getCheckStats(hours);

      res.json({
        success: true,
        data: {
          period: `${hours} hours`,
          ...stats,
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;