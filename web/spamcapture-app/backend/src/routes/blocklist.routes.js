/**
 * Blocklist Routes
 * Handles block list retrieval and export
 */

const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');

const blocklistService = require('../services/blocklist.service');
const { validate } = require('../utils/validators');

/**
 * @GET /api/blocklist
 * Get top reported numbers (community block list)
 */
router.get('/',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
    query('minReports')
      .optional()
      .isInt({ min: 1 })
      .withMessage('minReports must be a positive integer'),
    query('threatLevel')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid threat level'),
    validate,
  ],
  async (req, res, next) => {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 100,
        minReports: parseInt(req.query.minReports) || 1,
        threatLevel: req.query.threatLevel,
      };

      const blocklist = await blocklistService.getBlocklist(options);
      
      res.json({
        success: true,
        count: blocklist.length,
        data: blocklist,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @GET /api/blocklist/export
 * Export block list in various formats
 */
router.get('/export',
  [
    query('format')
      .optional()
      .isIn(['json', 'csv', 'txt'])
      .withMessage('Format must be json, csv, or txt'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10000 }),
    validate,
  ],
  async (req, res, next) => {
    try {
      const format = req.query.format || 'json';
      const limit = parseInt(req.query.limit) || 1000;

      const blocklist = await blocklistService.getBlocklist({ limit });
      
      switch (format) {
        case 'csv':
          const csv = blocklistService.exportToCSV(blocklist);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="spamcapture-blocklist-${Date.now()}.csv"`);
          res.send(csv);
          break;
          
        case 'txt':
          const txt = blocklistService.exportToTXT(blocklist);
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="spamcapture-blocklist-${Date.now()}.txt"`);
          res.send(txt);
          break;
          
        case 'json':
        default:
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="spamcapture-blocklist-${Date.now()}.json"`);
          res.json({
            success: true,
            exportedAt: new Date().toISOString(),
            count: blocklist.length,
            data: blocklist,
          });
          break;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @POST /api/blocklist/check
 * Check if phone numbers are in the block list
 */
router.post('/check',
  [
    body('phoneNumbers')
      .isArray({ min: 1, max: 100 })
      .withMessage('phoneNumbers must be an array with 1-100 items'),
    body('phoneNumbers.*')
      .isString()
      .withMessage('Each phone number must be a string'),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { phoneNumbers } = req.body;
      const results = await blocklistService.checkNumbers(phoneNumbers);
      
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @POST /api/blocklist/subscribe
 * Subscribe to automatic blocking updates
 */
router.post('/subscribe',
  [
    body('deviceToken')
      .notEmpty()
      .withMessage('Device token is required'),
    body('threshold')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Threshold must be between 1 and 100'),
    validate,
  ],
  async (req, res, next) => {
    try {
      const userId = req.headers['x-anonymous-user-id'];
      const subscription = await blocklistService.subscribe({
        userId,
        deviceToken: req.body.deviceToken,
        threshold: req.body.threshold || 5,
      });
      
      res.json({
        success: true,
        message: 'Successfully subscribed to block list updates',
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @GET /api/blocklist/stats
 * Get block list statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await blocklistService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
