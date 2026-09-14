#!/usr/bin/env node
/**
 * Database migration script
 * Sets up SpamShield tables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'spamcapture',
  user: process.env.DB_USER || 'spamshield',
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  console.log('🔄 Running database migrations...');

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by statement and execute
    const statements = schema.split(/;\s*$/m).filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();