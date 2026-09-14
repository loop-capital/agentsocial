/**
 * Statistics API routes
 * Public and authenticated statistics endpoints
 */

const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

const { getStatistics, getTopOffenders } = require('../utils/database');
const { getCacheStats } = require('../services/cache');
const { getRefreshStatus } = require('../services/intelligenceRefresh');
const { validateApiKey } = require('../middleware/auth');

/**
 * GET /api/v1/stats
 * Get overall blocking statistics
 */
router.get('/',
  async (req, res, next) => {
    try {
      const stats = await getStatistics();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/stats/top-offenders
 * Get top spam numbers
 */
router.get('/top-offenders',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt(),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
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

      const limit = parseInt(req.query.limit) || 20;
      const days = parseInt(req.query.days) || 30;

      const offenders = await getTopOffenders(limit, days);

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          count: offenders.length,
          offenders: offenders.map(o => ({
            phoneNumber: o.sender_phone,
            reportCount: parseInt(o.report_count),
            victimCount: parseInt(o.victim_count),
            lastReport: o.last_report,
            violationTypes: o.violation_types?.filter(Boolean) || [],
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/stats/system
 * Get system statistics (requires auth)
 */
router.get('/system',
  validateApiKey,
  async (req, res, next) => {
    try {
      const [dbStats, cacheStats, refreshStatus] = await Promise.all([
        getStatistics(),
        getCacheStats(),
        Promise.resolve(getRefreshStatus()),
      ]);

      res.json({
        success: true,
        data: {
          database: dbStats,
          cache: cacheStats,
          intelligence: refreshStatus,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;