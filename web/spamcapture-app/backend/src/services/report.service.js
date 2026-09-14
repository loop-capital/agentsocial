const { SpamReport, User, BlockList } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/errorHandler');

class ReportService {
  /**
   * Create a new spam report
   * @param {Object} reportData - Spam report data
   */
  static async createReport(reportData) {
    // Validate and normalize phone number
    const normalizedPhoneNumber = this.normalizePhoneNumber(reportData.phoneNumber);

    // Create the report
    const report = await SpamReport.create({
      ...reportData,
      phoneNumber: normalizedPhoneNumber
    });

    return report;
  }

  /**
   * Get reports with pagination and filters
   * @param {Object} filters - Query filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  static async getReports(filters = {}, page = 1, limit = 20) {
    const where = {};
    const include = [];

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.phoneNumber) {
      where.phoneNumber = this.normalizePhoneNumber(filters.phoneNumber);
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Date range filter
    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) {
        where.timestamp[Op.gte] = new Date(filters.from);
      }
      if (filters.to) {
        where.timestamp[Op.lte] = new Date(filters.to);
      }
    }

    // Include user data if requested
    if (filters.includeUser) {
      include.push({
        model: User,
        as: 'user',
        attributes: ['id', 'anonymousId']
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await SpamReport.findAndCountAll({
      where,
      include,
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });

    return {
      items: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      page,
      limit
    };
  }

  /**
   * Get a single report by ID
   * @param {string} id - Report ID
   */
  static async getReportById(id) {
    const report = await SpamReport.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'anonymousId']
        }
      ]
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return report;
  }

  /**
   * Get reports for a specific phone number
   * @param {string} phoneNumber - Phone number
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  static async getReportsByPhoneNumber(phoneNumber, page = 1, limit = 20) {
    const normalizedPhoneNumber = this.normalizePhoneNumber(phoneNumber);

    const offset = (page - 1) * limit;

    const { count, rows } = await SpamReport.findAndCountAll({
      where: { phoneNumber: normalizedPhoneNumber },
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });

    return {
      items: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      page,
      limit
    };
  }

  /**
   * Get report statistics
   * @param {Object} dateRange - Date range filters
   */
  static async getStats(dateRange = {}) {
    const where = {};

    if (dateRange.from || dateRange.to) {
      where.timestamp = {};
      if (dateRange.from) {
        where.timestamp[Op.gte] = new Date(dateRange.from);
      }
      if (dateRange.to) {
        where.timestamp[Op.lte] = new Date(dateRange.to);
      }
    }

    // Get total reports
    const totalReports = await SpamReport.count({ where });

    // Get reports by type
    const reportsByType = await SpamReport.findAll({
      where,
      attributes: ['type', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['type'],
      raw: true
    });

    // Get reports by category
    const reportsByCategory = await SpamReport.findAll({
      where,
      attributes: ['category', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['category'],
      raw: true
    });

    // Get top reported numbers
    const topNumbers = await SpamReport.findAll({
      where,
      attributes: [
        'phoneNumber',
        [require('sequelize').fn('COUNT', '*'), 'reportCount']
      ],
      group: ['phoneNumber'],
      order: [['reportCount', 'DESC']],
      limit: 10,
      raw: true
    });

    // Get reports over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reportsOverTime = await SpamReport.findAll({
      where: {
        ...where,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('timestamp')), 'date'),
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('timestamp'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('timestamp')), 'ASC')],
      raw: true
    });

    return {
      totalReports,
      byType: reportsByType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count, 10);
        return acc;
      }, {}),
      byCategory: reportsByCategory.reduce((acc, item) => {
        acc[item.category || 'uncategorized'] = parseInt(item.count, 10);
        return acc;
      }, {}),
      topNumbers: topNumbers.map(item => ({
        phoneNumber: item.phoneNumber,
        reportCount: parseInt(item.reportCount, 10)
      })),
      reportsOverTime: reportsOverTime.map(item => ({
        date: item.date,
        count: parseInt(item.count, 10)
      }))
    };
  }

  /**
   * Normalize phone number to E.164 format
   * @param {string} phoneNumber - Raw phone number
   */
  static normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters
    let normalized = phoneNumber.replace(/\D/g, '');
    
    // Add + prefix if missing
    if (!normalized.startsWith('1') && normalized.length === 10) {
      // Assume US number without country code
      normalized = '1' + normalized;
    }
    
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }
}

module.exports = ReportService;
