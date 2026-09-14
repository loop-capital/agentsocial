/**
 * Redis cache service for performance optimization
 */

const redis = require('redis');
const { logger } = require('./logger');

let client = null;

/**
 * Initialize Redis connection
 */
async function initializeCache() {
  if (client) return client;

  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis connected');
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Return null to allow graceful degradation
    return null;
  }
}

/**
 * Get cached value
 */
async function getCache(key) {
  if (!client) return null;

  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached value with TTL
 */
async function setCache(key, value, ttlSeconds = 300) {
  if (!client) return false;

  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete cached value
 */
async function deleteCache(key) {
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Get cache key for phone number check
 */
function getPhoneCacheKey(phoneNumber, sensitivity) {
  return `shield:phone:${phoneNumber}:${sensitivity}`;
}

/**
 * Clear phone number cache
 */
async function invalidatePhoneCache(phoneNumber) {
  if (!client) return false;

  try {
    const keys = await client.keys(`shield:phone:${phoneNumber}:*`);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Cache invalidation error:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  if (!client) return { connected: false };

  try {
    const info = await client.info('stats');
    return {
      connected: true,
      info: info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Cache stats error:', error);
    return { connected: false, error: error.message };
  }
}

module.exports = {
  initializeCache,
  getCache,
  setCache,
  deleteCache,
  getPhoneCacheKey,
  invalidatePhoneCache,
  getCacheStats,
};