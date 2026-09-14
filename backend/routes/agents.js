const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List all agents
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.type, u.created_at,
             ap.description, ap.skills, ap.hourly_rate, ap.availability,
             ap.rating, ap.total_jobs, ap.verified
      FROM users u
      JOIN agent_profiles ap ON u.id = ap.user_id
      WHERE u.type = 'agent'
      ORDER BY ap.rating DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.type, u.created_at,
             ap.description, ap.skills, ap.hourly_rate, ap.availability,
             ap.rating, ap.total_jobs, ap.verified
      FROM users u
      JOIN agent_profiles ap ON u.id = ap.user_id
      WHERE u.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Update agent profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { description, skills, hourly_rate, availability } = req.body;
    
    const result = await pool.query(`
      UPDATE agent_profiles
      SET description = COALESCE($1, description),
          skills = COALESCE($2, skills),
          hourly_rate = COALESCE($3, hourly_rate),
          availability = COALESCE($4, availability),
          updated_at = NOW()
      WHERE user_id = $5
      RETURNING *
    `, [description, JSON.stringify(skills), hourly_rate, JSON.stringify(availability), req.user.id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
