const { BlockList, SpamReport, sequelize } = require('../models');
const { Op } = require('sequelize');

class BlockListService {
  /**
   * Aggregate spam reports and update block list for a phone number
   * @param {string} phoneNumber - The phone number to aggregate
   */
  static async aggregateReport(phoneNumber) {
    const transaction = await sequelize.transaction();

    try {
      // Count total reports for this number
      const reportCount = await SpamReport.count({
        where: { phoneNumber },
        transaction
      });

      // Get the latest report timestamp
      const latestReport = await SpamReport.findOne({
        where: { phoneNumber },
        order: [['timestamp', 'DESC']],
        transaction
      });

      // Calculate threat level based on report count
      const threatLevel = this.calculateThreatLevel(reportCount);

      // Upsert block list entry
      const [blockListEntry, created] = await BlockList.findOrCreate({
        where: { phoneNumber },
        defaults: {
          phoneNumber,
          reportCount,
          lastReported: latestReport?.timestamp || new Date(),
          threatLevel
        },
        transaction
      });

      if (!created) {
        await blockListEntry.update({
          reportCount,
          lastReported: latestReport?.timestamp || new Date(),
          threatLevel
        }, { transaction });
      }

      await transaction.commit();
      return blockListEntry;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Calculate threat level based on report count
   * @param {number} reportCount - Number of reports
   * @returns {string} Threat level (low, medium, high, critical)
   */
  static calculateThreatLevel(reportCount) {
    if (reportCount >= 50) return 'critical';
    if (reportCount >= 20) return 'high';
    if (reportCount >= 5) return 'medium';
    return 'low';
  }

  /**
   * Get block list entries with pagination and filters
   * @param {Object} filters - Query filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  static async getBlockList(filters = {}, page = 1, limit = 50) {
    const where = {};

    if (filters.threatLevel) {
      where.threatLevel = filters.threatLevel;
    }

    if (filters.minReports) {
      where.reportCount = { [Op.gte]: filters.minReports };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await BlockList.findAndCountAll({
      where,
      order: [
        ['reportCount', 'DESC'],
        ['lastReported', 'DESC']
      ],
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
   * Export block list as JSON or CSV
   * @param {string} format - Export format (json or csv)
   * @param {Object} filters - Query filters
   */
  static async exportBlockList(format = 'json', filters = {}) {
    const where = {};

    if (filters.threatLevel) {
      where.threatLevel = filters.threatLevel;
    }

    const entries = await BlockList.findAll({
      where,
      order: [['reportCount', 'DESC']],
      raw: true
    });

    if (format === 'csv') {
      return this.convertToCSV(entries);
    }

    return entries;
  }

  /**
   * Convert block list entries to CSV format
   * @param {Array} entries - Block list entries
   */
  static convertToCSV(entries) {
    if (entries.length === 0) {
      return 'phoneNumber,reportCount,lastReported,threatLevel\n';
    }

    const headers = ['phoneNumber', 'reportCount', 'lastReported', 'threatLevel'];
    const rows = entries.map(entry => 
      `${entry.phoneNumber},${entry.reportCount},"${entry.lastReported}",${entry.threatLevel}`
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Get top reported numbers
   * @param {number} limit - Number of entries to return
   */
  static async getTopReported(limit = 20) {
    return await BlockList.findAll({
      order: [['reportCount', 'DESC']],
      limit,
      raw: true
    });
  }

  /**
   * Get block list statistics
   */
  static async getStats() {
    const stats = await BlockList.findAll({
      attributes: [
        'threatLevel',
        [sequelize.fn('COUNT', sequelize.col('*')), 'count'],
        [sequelize.fn('SUM', sequelize.col('reportCount')), 'totalReports']
      ],
      group: ['threatLevel'],
      raw: true
    });

    const totalEntries = await BlockList.count();
    const totalReports = await BlockList.sum('reportCount') || 0;

    return {
      totalEntries,
      totalReports,
      byThreatLevel: stats.reduce((acc, item) => {
        acc[item.threatLevel] = {
          count: parseInt(item.count, 10),
          totalReports: parseInt(item.totalReports, 10)
        };
        return acc;
      }, {})
    };
  }

  /**
   * Check if a phone number is in the block list
   * @param {string} phoneNumber - Phone number to check
   */
  static async isBlocked(phoneNumber) {
    const entry = await BlockList.findOne({
      where: { phoneNumber },
      raw: true
    });

    if (!entry) {
      return { blocked: false, entry: null };
    }

    return {
      blocked: entry.reportCount >= 3, // Block if 3+ reports
      entry
    };
  }
}

module.exports = BlockListService;
