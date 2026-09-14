/**
 * Database connection and query utilities
 */

const { Pool } = require('pg');
const { logger } = require('./logger');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Use connection string if provided, otherwise use individual params
  ...(process.env.DATABASE_URL ? {} : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'spamcapture',
    user: process.env.DB_USER || 'spamshield',
    password: process.env.DB_PASSWORD,
  }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection events
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});

/**
 * Execute a query with error handling
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error:', { error: error.message, query: text });
    throw error;
  }
}

/**
 * Get aggregated report data for a phone number
 * Used by the risk scoring algorithm
 */
async function getPhoneNumberData(phoneNumber) {
  const sql = `
    WITH number_stats AS (
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT reporter_phone) as unique_victims,
        COUNT(DISTINCT pattern_group_id) as pattern_groups,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_reports,
        MIN(created_at) as first_seen,
        MAX(created_at) as last_seen,
        array_agg(DISTINCT unnested_violation_type) as report_types
      FROM spam_reports,
      LATERAL unnest(COALESCE(violation_type, ARRAY[]::text[])) as unnested_violation_type
      WHERE sender_phone = $1
    ),
    attorney_matches AS (
      SELECT COUNT(DISTINCT attorney_id) as attorney_count
      FROM spam_reports
      WHERE sender_phone = $1 
        AND attorney_id IS NOT NULL
        AND status IN ('matched', 'active', 'settled')
    ),
    false_positives AS (
      SELECT COUNT(*) as fp_count
      FROM spam_reports
      WHERE sender_phone = $1 
        AND status = 'dismissed'
    )
    SELECT 
      COALESCE(ns.total_reports, 0) as total_reports,
      COALESCE(ns.recent_reports, 0) as recent_reports,
      COALESCE(ns.unique_victims, 0) as unique_victims,
      COALESCE(ns.pattern_groups, 0) as pattern_groups,
      ns.first_seen::text,
      ns.last_seen::text,
      COALESCE(ns.report_types, ARRAY[]::text[]) as report_types,
      COALESCE(am.attorney_count, 0) as attorney_matches,
      COALESCE(fp.fp_count, 0) as false_positive_reports
    FROM number_stats ns
    CROSS JOIN attorney_matches am
    CROSS JOIN false_positives fp
  `;

  const result = await query(sql, [phoneNumber]);
  return result.rows[0] || {
    total_reports: 0,
    recent_reports: 0,
    unique_victims: 0,
    pattern_groups: 0,
    first_seen: null,
    last_seen: null,
    report_types: [],
    attorney_matches: 0,
    false_positive_reports: 0,
  };
}

/**
 * Get top spam numbers for dashboard/stats
 */
async function getTopOffenders(limit = 20, days = 30) {
  const sql = `
    SELECT 
      sender_phone,
      COUNT(*) as report_count,
      COUNT(DISTINCT reporter_phone) as victim_count,
      MAX(created_at) as last_report,
      array_agg(DISTINCT unnested_violation_type) as violation_types
    FROM spam_reports,
    LATERAL unnest(COALESCE(violation_type, ARRAY[]::text[])) as unnested_violation_type
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY sender_phone
    ORDER BY report_count DESC, last_report DESC
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
}

/**
 * Get overall statistics
 */
async function getStatistics() {
  const queries = [
    { name: 'total_numbers', sql: 'SELECT COUNT(DISTINCT sender_phone) FROM spam_reports' },
    { name: 'total_reports', sql: 'SELECT COUNT(*) FROM spam_reports' },
    { name: 'reports_today', sql: "SELECT COUNT(*) FROM spam_reports WHERE DATE(created_at) = CURRENT_DATE" },
    { name: 'reports_last_7_days', sql: "SELECT COUNT(*) FROM spam_reports WHERE created_at > NOW() - INTERVAL '7 days'" },
    { name: 'active_cases', sql: "SELECT COUNT(*) FROM cases WHERE status IN ('open', 'in_progress')" },
    { name: 'total_victims', sql: 'SELECT COUNT(DISTINCT reporter_phone) FROM spam_reports WHERE reporter_phone IS NOT NULL' },
    { name: 'validated_reports', sql: "SELECT COUNT(*) FROM spam_reports WHERE status = 'validated'" },
  ];

  const results = {};
  for (const { name, sql } of queries) {
    const result = await query(sql);
    results[name] = parseInt(result.rows[0].count);
  }

  return results;
}

/**
 * Add manual override for a phone number
 */
async function addOverride(phoneNumber, decision, reason, adminId) {
  const sql = `
    INSERT INTO spamshield_overrides (
      phone_number, decision, reason, created_by, created_at, expires_at
    ) VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '90 days')
    ON CONFLICT (phone_number) DO UPDATE SET
      decision = EXCLUDED.decision,
      reason = EXCLUDED.reason,
      created_by = EXCLUDED.created_by,
      created_at = EXCLUDED.created_at,
      expires_at = EXCLUDED.expires_at
    RETURNING *
  `;

  const result = await query(sql, [phoneNumber, decision, reason, adminId]);
  return result.rows[0];
}

/**
 * Remove manual override
 */
async function removeOverride(phoneNumber) {
  const sql = 'DELETE FROM spamshield_overrides WHERE phone_number = $1 RETURNING *';
  const result = await query(sql, [phoneNumber]);
  return result.rows[0];
}

/**
 * Get manual override for a phone number
 */
async function getOverride(phoneNumber) {
  const sql = `
    SELECT * FROM spamshield_overrides 
    WHERE phone_number = $1 
      AND (expires_at IS NULL OR expires_at > NOW())
  `;
  const result = await query(sql, [phoneNumber]);
  return result.rows[0] || null;
}

/**
 * Get all active overrides
 */
async function getAllOverrides(limit = 100, offset = 0) {
  const sql = `
    SELECT * FROM spamshield_overrides 
    WHERE expires_at IS NULL OR expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await query(sql, [limit, offset]);
  return result.rows;
}

/**
 * Log a check event for analytics
 */
async function logCheckEvent(phoneNumber, result, apiKeyId, requestInfo) {
  const sql = `
    INSERT INTO spamshield_check_logs (
      phone_number, risk_score, risk_level, recommendation, action,
      api_key_id, ip_address, user_agent, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `;

  await query(sql, [
    phoneNumber,
    result.score,
    result.level,
    result.recommendation,
    result.action,
    apiKeyId,
    requestInfo.ip,
    requestInfo.userAgent,
  ]);
}

/**
 * Get check logs for analytics
 */
async function getCheckStats(hours = 24) {
  const sql = `
    SELECT 
      COUNT(*) as total_checks,
      COUNT(CISTINCT phone_number) as unique_numbers,
      AVG(risk_score) as avg_risk_score,
      COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_count,
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_count,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_count,
      COUNT(CASE WHEN risk_level IN ('low', 'safe') THEN 1 END) as safe_count
    FROM spamshield_check_logs
    WHERE created_at > NOW() - INTERVAL '${hours} hours'
  `;

  const result = await query(sql);
  return result.rows[0];
}

module.exports = {
  pool,
  query,
  getPhoneNumberData,
  getTopOffenders,
  getStatistics,
  addOverride,
  removeOverride,
  getOverride,
  getAllOverrides,
  logCheckEvent,
  getCheckStats,
};