/**
 * Report Routes
 * Handles spam report submission and retrieval
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');

const reportService = require('../services/report.service');
const { validate } = require('../utils/validators');

/**
 * @POST /api/reports
 * Submit a new spam report
 */
router.post('/',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Invalid phone number format')
      .trim(),
    body('type')
      .notEmpty()
      .withMessage('Report type is required')
      .isIn(['sms', 'call'])
      .withMessage('Type must be either "sms" or "call"'),
    body('content')
      .optional()
      .isString()
      .isLength({ max: 5000 })
      .withMessage('Content must be less than 5000 characters'),
    body('category')
      .optional()
      .isIn(['spam', 'scam', 'phishing', 'robocall', 'telemarketing', 'other'])
      .withMessage('Invalid category'),
    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('Invalid timestamp format'),
    validate,
  ],
  async (req, res, next) => {
    try {
      const userId = req.headers['x-anonymous-user-id'] || null;
      const reportData = {
        ...req.body,
        userId,
      };

      const report = await reportService.createReport(reportData);
      
      res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @GET /api/reports
 * Get reports with optional filtering
 */
router.get('/',
  [
    query('type')
      .optional()
      .isIn(['sms', 'call'])
      .withMessage('Type must be either "sms" or "call"'),
    query('phoneNumber')
      .optional()
      .isString()
      .trim(),
    query('category')
      .optional()
      .isIn(['spam', 'scam', 'phishing', 'robocall', 'telemarketing', 'other']),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  async (req, res, next) => {
    try {
      const filters = {
        type: req.query.type,
        phoneNumber: req.query.phoneNumber,
        category: req.query.category,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await reportService.getReports(filters);
      
      res.json({
        success: true,
        data: result.reports,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          pages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @GET /api/reports/:id
 * Get a specific report by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @GET /api/reports/phone/:phoneNumber
 * Get all reports for a specific phone number
 */
router.get('/phone/:phoneNumber', async (req, res, next) => {
  try {
    const reports = await reportService.getReportsByPhoneNumber(req.params.phoneNumber);
    
    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
