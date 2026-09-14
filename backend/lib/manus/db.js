/**
 * Manus DB helpers — thin wrappers around pg for Manus schema.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get or create today's usage row for a workspace.
 * Returns the row (idempotent — uses UPSERT).
 */
async function getOrCreateDailyUsage(workspaceId, dateStr = null) {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `INSERT INTO manus_usage_daily (id, workspace_id, usage_date)
     VALUES (gen_random_uuid(), $1::uuid, $2::date)
     ON CONFLICT (workspace_id, usage_date) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [workspaceId, date]
  );
  return result.rows[0];
}

/**
 * Increment a specific call counter for a workspace.
 */
async function incrementUsage(workspaceId, field, amount = 1, dateStr = null) {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const allowedFields = [
    'api_calls', 'credits_consumed', 'ad_library_calls',
    'audience_insights_calls', 'business_suite_calls', 'messaging_calls',
  ];
  if (!allowedFields.includes(field)) throw new Error(`Invalid usage field: ${field}`);

  await pool.query(
    `INSERT INTO manus_usage_daily (id, workspace_id, usage_date, ${field})
     VALUES (gen_random_uuid(), $1::uuid, $2::date, $3)
     ON CONFLICT (workspace_id, usage_date) DO UPDATE SET ${field} = manus_usage_daily.${field} + $3, updated_at = NOW()`,
    [workspaceId, date, amount]
  );
}

/**
 * Get today's usage for a workspace.
 */
async function getTodayUsage(workspaceId) {
  const date = new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT * FROM manus_usage_daily WHERE workspace_id = $1::uuid AND usage_date = $2::date`,
    [workspaceId, date]
  );
  return result.rows[0] || null;
}

/**
 * Decrement credits remaining for a workspace (after a Manus API call).
 */
async function decrementCredits(workspaceId, amount, dateStr = null) {
  const date = dateStr || new Date().toISOString().split('T')[0];
  await pool.query(
    `UPDATE manus_usage_daily
     SET credits_remaining = GREATEST(credits_remaining - $3, 0), updated_at = NOW()
     WHERE workspace_id = $1::uuid AND usage_date = $2::date`,
    [workspaceId, date, amount]
  );
}

/**
 * Get priority config for a task type.
 */
async function getPriorityConfig(taskType) {
  const result = await pool.query(
    `SELECT * FROM manus_priority_tasks WHERE task_type = $1 AND is_active = TRUE`,
    [taskType]
  );
  return result.rows[0] || null;
}

/**
 * Get cached value if not expired.
 */
async function getCache(workspaceId, cacheKey) {
  const result = await pool.query(
    `SELECT * FROM manus_cache
     WHERE workspace_id = $1::uuid AND cache_key = $2 AND expires_at > NOW()`,
    [workspaceId, cacheKey]
  );
  return result.rows[0] || null;
}

/**
 * Set or update a cache entry.
 */
async function setCache(workspaceId, cacheKey, cacheValue, expiresAt) {
  await pool.query(
    `INSERT INTO manus_cache (id, workspace_id, cache_key, cache_value, expires_at)
     VALUES (gen_random_uuid(), $1::uuid, $2, $3::jsonb, $4)
     ON CONFLICT (workspace_id, cache_key) DO UPDATE SET cache_value = $3::jsonb, expires_at = $4, updated_at = NOW()`,
    [workspaceId, cacheKey, JSON.stringify(cacheValue), expiresAt]
  );
}

/**
 * Delete expired cache entries (called periodically).
 */
async function cleanExpiredCache() {
  await pool.query(`DELETE FROM manus_cache WHERE expires_at < NOW()`);
}

/**
 * Reset daily counters for all workspaces (called at midnight UTC).
 */
async function resetDailyCounters() {
  const today = new Date().toISOString().split('T')[0];
  // Reset all workspaces for the new day (upsert blank rows)
  await pool.query(
    `INSERT INTO manus_usage_daily (id, workspace_id, usage_date, api_calls, credits_consumed, ad_library_calls, audience_insights_calls, business_suite_calls, messaging_calls)
     SELECT gen_random_uuid(), id, $1::date, 0, 0, 0, 0, 0, 0
     FROM workspaces
     ON CONFLICT (workspace_id, usage_date) DO NOTHING`,
    [today]
  );
}

module.exports = {
  pool,
  getOrCreateDailyUsage,
  incrementUsage,
  getTodayUsage,
  decrementCredits,
  getPriorityConfig,
  getCache,
  setCache,
  cleanExpiredCache,
  resetDailyCounters,
};
