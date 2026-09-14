#!/usr/bin/env node
/**
 * Manual intelligence refresh script
 * Updates aggregated stats from SpamCapture data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'spamcapture',
  user: process.env.DB_USER || 'spamshield',
  password: process.env.DB_PASSWORD,
});

async function refreshIntelligence() {
  console.log('🔄 Refreshing blocking intelligence...');
  const startTime = Date.now();

  try {
    // Refresh number stats
    await pool.query('SELECT refresh_number_stats()');

    // Get summary
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_numbers,
        SUM(total_reports) as total_reports,
        SUM(recent_reports) as recent_reports
      FROM spamshield_number_stats
    `);

    const duration = Date.now() - startTime;
    const stats = statsResult.rows[0];

    console.log('✅ Intelligence refresh completed');
    console.log(`   - ${stats.total_numbers} numbers in database`);
    console.log(`   - ${stats.total_reports} total reports`);
    console.log(`   - ${stats.recent_reports} recent reports (30d)`);
    console.log(`   - Duration: ${duration}ms`);

  } catch (error) {
    console.error('❌ Refresh failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  refreshIntelligence();
}

module.exports = { refreshIntelligence };