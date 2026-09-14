/**
 * User Routes
 * Handles anonymous user creation and management
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const userService = require('../services/user.service');
const { validate } = require('../utils/validators');

/**
 * @POST /api/users/register
 * Register a new anonymous user
 */
router.post('/register',
  [
    body('deviceToken')
      .optional()
      .isString(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const user = await userService.createUser({
        deviceToken: req.body.deviceToken,
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          userId: user.anonymousId,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @GET /api/users/:userId/reports
 * Get all reports submitted by a user
 */
router.get('/:userId/reports', async (req, res, next) => {
  try {
    const reports = await userService.getUserReports(req.params.userId);
    
    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @POST /api/users/sync
 * Sync user data (for SpamSuit integration)
 */
router.post('/sync',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('spamsuitId')
      .optional()
      .isString(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const result = await userService.syncWithSpamSuit({
        userId: req.body.userId,
        spamsuitId: req.body.spamsuitId,
      });
      
      res.json({
        success: true,
        message: 'User data synced successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
