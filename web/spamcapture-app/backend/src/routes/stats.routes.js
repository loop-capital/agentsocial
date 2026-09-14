/**
 * Stats Routes
 * Provides community statistics and analytics
 */

const express = require('express');
const router = express.Router();

const statsService = require('../services/stats.service');

/**
 * @GET /api/stats
 * Get overall community statistics
 */
router.get('/', async (req, res, next) => {
  try {
    const stats = await statsService.getOverallStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @GET /api/stats/trending
 * Get trending spam numbers
 */
router.get('/trending', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trending = await statsService.getTrendingNumbers(limit);
    
    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @GET /api/stats/categories
 * Get report breakdown by category
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await statsService.getCategoryStats();
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @GET /api/stats/timeline
 * Get reports timeline
 */
router.get('/timeline', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const timeline = await statsService.getTimeline(days);
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
