const { SpamReport, BlockList, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class StatsService {
  /**
   * Get comprehensive community statistics
   * @param {Object} dateRange - Optional date range filters
   */
  static async getCommunityStats(dateRange = {}) {
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

    // Get report statistics
    const reportStats = await this.getReportStats(where);
    
    // Get block list statistics
    const blockListStats = await BlockList.findAll({
      attributes: [
        'threatLevel',
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('SUM', sequelize.col('reportCount')), 'totalReports']
      ],
      group: ['threatLevel'],
      raw: true
    });

    // Get user statistics
    const userStats = await this.getUserStats(where);

    // Get activity over time
    const activityStats = await this.getActivityStats(dateRange);

    // Calculate community protection metrics
    const totalBlockedNumbers = await BlockList.count({
      where: { reportCount: { [Op.gte]: 3 } }
    });

    const highThreatNumbers = await BlockList.count({
      where: { 
        threatLevel: { [Op.in]: ['high', 'critical'] } 
      }
    });

    return {
      reports: reportStats,
      blockList: {
        totalEntries: await BlockList.count(),
        totalBlockedNumbers,
        highThreatNumbers,
        byThreatLevel: blockListStats.reduce((acc, item) => {
          acc[item.threatLevel] = {
            count: parseInt(item.count, 10),
            totalReports: parseInt(item.totalReports, 10)
          };
          return acc;
        }, {})
      },
      users: userStats,
      activity: activityStats,
      protection: {
        estimatedBlockedCalls: totalBlockedNumbers * 100, // Estimate
        totalCommunityReports: reportStats.totalReports
      }
    };
  }

  /**
   * Get report statistics
   */
  static async getReportStats(where = {}) {
    const totalReports = await SpamReport.count({ where });

    // Reports by type
    const reportsByType = await SpamReport.findAll({
      where,
      attributes: ['type', [sequelize.fn('COUNT', '*'), 'count']],
      group: ['type'],
      raw: true
    });

    // Reports by category
    const reportsByCategory = await SpamReport.findAll({
      where,
      attributes: ['category', [sequelize.fn('COUNT', '*'), 'count']],
      group: ['category'],
      raw: true
    });

    // Reports in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reportsLast24h = await SpamReport.count({
      where: {
        ...where,
        timestamp: { [Op.gte]: last24Hours }
      }
    });

    // Reports in last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reportsLast7d = await SpamReport.count({
      where: {
        ...where,
        timestamp: { [Op.gte]: last7Days }
      }
    });

    // Reports in last 30 days
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reportsLast30d = await SpamReport.count({
      where: {
        ...where,
        timestamp: { [Op.gte]: last30Days }
      }
    });

    return {
      totalReports,
      reportsLast24h,
      reportsLast7d,
      reportsLast30d,
      byType: reportsByType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count, 10);
        return acc;
      }, {}),
      byCategory: reportsByCategory.reduce((acc, item) => {
        acc[item.category || 'uncategorized'] = parseInt(item.count, 10);
        return acc;
      }, {})
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStats(where = {}) {
    const totalUsers = await User.count();

    // Active users (users who have submitted reports)
    const activeUsers = await SpamReport.count({
      where,
      distinct: true,
      col: 'userId'
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    };
  }

  /**
   * Get activity statistics over time
   */
  static async getActivityStats(dateRange = {}) {
    const where = {};

    if (dateRange.from || dateRange.to) {
      where.timestamp = {};
      if (dateRange.from) {
        where.timestamp[Op.gte] = new Date(dateRange.from);
      }
      if (dateRange.to) {
        where.timestamp[Op.lte] = new Date(dateRange.to);
      }
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.timestamp = { [Op.gte]: thirtyDaysAgo };
    }

    // Daily activity
    const dailyActivity = await SpamReport.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']],
      raw: true
    });

    // Hourly distribution (for today or last 24h)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyDistribution = await SpamReport.findAll({
      where: {
        timestamp: { [Op.gte]: last24Hours }
      },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp')), 'hour'],
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp'))],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp')), 'ASC']],
      raw: true
    });

    return {
      daily: dailyActivity.map(item => ({
        date: item.date,
        count: parseInt(item.count, 10)
      })),
      hourly: hourlyDistribution.map(item => ({
        hour: parseInt(item.hour, 10),
        count: parseInt(item.count, 10)
      }))
    };
  }

  /**
   * Get trending spam numbers
   * @param {number} limit - Number of trending numbers to return
   */
  static async getTrendingNumbers(limit = 10) {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await SpamReport.findAll({
      where: {
        timestamp: { [Op.gte]: last7Days }
      },
      attributes: [
        'phoneNumber',
        [sequelize.fn('COUNT', '*'), 'recentReports'],
        [sequelize.max('timestamp'), 'lastReported']
      ],
      group: ['phoneNumber'],
      order: [['recentReports', 'DESC']],
      limit,
      raw: true
    });

    return trending.map(item => ({
      phoneNumber: item.phoneNumber,
      recentReports: parseInt(item.recentReports, 10),
      lastReported: item.lastReported
    }));
  }
}

module.exports = StatsService;
