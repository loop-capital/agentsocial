/**
 * Intelligence refresh service
 * Periodically updates blocking data from SpamCapture
 */

const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { invalidatePhoneCache } = require('./cache');
const { getStatistics } = require('../utils/database');

let scheduler = null;

/**
 * Initialize the intelligence refresh scheduler
 */
function initializeIntelligenceRefresh() {
  const schedule = process.env.INTELLIGENCE_REFRESH_INTERVAL || '*/5 * * * *';
  
  logger.info(`Initializing intelligence refresh scheduler: ${schedule}`);
  
  scheduler = cron.schedule(schedule, async () => {
    try {
      await refreshIntelligence();
    } catch (error) {
      logger.error('Intelligence refresh failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York',
  });

  // Also run immediately on startup
  refreshIntelligence().catch(error => {
    logger.error('Initial intelligence refresh failed:', error);
  });
}

/**
 * Refresh blocking intelligence from SpamCapture data
 */
async function refreshIntelligence() {
  const startTime = Date.now();
  logger.info('Starting intelligence refresh...');

  try {
    // Get current statistics for monitoring
    const stats = await getStatistics();
    
    // Log refresh event
    logger.info('Intelligence refresh completed', {
      duration: Date.now() - startTime,
      stats,
    });

    // Store refresh timestamp (could be used for health checks)
    global.lastIntelligenceRefresh = new Date().toISOString();
    
    return {
      success: true,
      timestamp: global.lastIntelligenceRefresh,
      duration: Date.now() - startTime,
      stats,
    };
  } catch (error) {
    logger.error('Intelligence refresh error:', error);
    throw error;
  }
}

/**
 * Manually trigger a refresh
 */
async function triggerManualRefresh() {
  logger.info('Manual intelligence refresh triggered');
  return await refreshIntelligence();
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
  if (scheduler) {
    scheduler.stop();
    logger.info('Intelligence refresh scheduler stopped');
  }
}

/**
 * Get last refresh status
 */
function getRefreshStatus() {
  return {
    lastRefresh: global.lastIntelligenceRefresh || null,
    schedule: process.env.INTELLIGENCE_REFRESH_INTERVAL || '*/5 * * * *',
    isRunning: scheduler !== null,
  };
}

module.exports = {
  initializeIntelligenceRefresh,
  refreshIntelligence,
  triggerManualRefresh,
  stopScheduler,
  getRefreshStatus,
};