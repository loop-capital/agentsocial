#!/usr/bin/env node
/**
 * Seed script for development/testing
 * Creates sample data for testing the blocking service
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

async function seed() {
  console.log('🌱 Seeding development data...');

  try {
    // Check if we already have spam_reports
    const checkResult = await pool.query('SELECT COUNT(*) FROM spam_reports');
    const count = parseInt(checkResult.rows[0].count);

    if (count > 0) {
      console.log(`ℹ️  Found ${count} existing spam reports, skipping seed`);
      return;
    }

    // Insert sample spam reports
    const sampleData = [
      // High-risk numbers (many reports)
      { phone: '+15551234567', reports: 150, days: 30, type: 'health_insurance' },
      { phone: '+15559876543', reports: 89, days: 45, type: 'auto_warranty' },
      { phone: '+15551112222', reports: 67, days: 20, type: 'tax_scam' },
      { phone: '+15553334444', reports: 45, days: 15, type: 'lottery' },
      { phone: '+15555556666', reports: 38, days: 10, type: 'tech_support' },
      
      // Medium-risk numbers
      { phone: '+15557778888', reports: 12, days: 25, type: 'political' },
      { phone: '+15559990000', reports: 8, days: 30, type: 'survey' },
      { phone: '+15551234000', reports: 5, days: 14, type: 'charity' },
    ];

    for (const data of sampleData) {
      // Generate multiple reports for each number
      for (let i = 0; i < Math.min(data.reports, 20); i++) {
        const violationTypes = [
          'auto-dialer',
          'no-consent',
          ...(Math.random() > 0.7 ? ['spoofed'] : []),
          ...(Math.random() > 0.8 ? ['after-opt-out'] : []),
        ];

        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * data.days));

        await pool.query(`
          INSERT INTO spam_reports (
            sender_phone, message_body, received_at, reporter_phone,
            spam_score, is_tcpa_violation, violation_type, status,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          data.phone,
          `Sample ${data.type} spam message #${i + 1}`,
          createdAt,
          `+1555${String(1000000 + Math.floor(Math.random() * 8999999)).slice(1)}`,
          Math.floor(Math.random() * 30) + 70,
          true,
          violationTypes,
          'validated',
          createdAt,
        ]);
      }
    }

    // Create some manual overrides
    await pool.query(`
      INSERT INTO spamshield_overrides (phone_number, decision, reason, created_by, created_at)
      VALUES 
        ('+15550000000', 'allow', 'Verified legitimate business number', 'admin', NOW()),
        ('+15551111111', 'block', 'Confirmed scam operation by authorities', 'admin', NOW())
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Seed data inserted successfully');
    console.log(`   - ${sampleData.length} phone numbers with reports`);
    console.log('   - 2 manual overrides created');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();