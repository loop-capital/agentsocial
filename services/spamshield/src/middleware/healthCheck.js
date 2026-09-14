/**
 * Health check endpoint
 */

const { logger } = require('../utils/logger');
const { getRefreshStatus } = require('../services/intelligenceRefresh');

async function healthCheck(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      intelligence: getRefreshStatus(),
    },
  };

  // Determine overall status
  const hasFailures = Object.values(health.checks).some(
    check => check && check.status === 'unhealthy'
  );

  if (hasFailures) {
    health.status = 'degraded';
    return res.status(503).json(health);
  }

  res.json(health);
}

async function checkDatabase() {
  try {
    const { pool } = require('../utils/database');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'healthy', responseTime: 'ok' };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkCache() {
  try {
    const { getCache, setCache } = require('../services/cache');
    const testKey = `health:${Date.now()}`;
    await setCache(testKey, 'ok', 10);
    const value = await getCache(testKey);
    return { 
      status: value === 'ok' ? 'healthy' : 'unhealthy',
      responseTime: 'ok'
    };
  } catch (error) {
    logger.error('Cache health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

module.exports = { healthCheck };