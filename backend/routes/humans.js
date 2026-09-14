const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List all humans
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.type, u.created_at,
             hp.description, hp.services, hp.location_lat, hp.location_lng,
             hp.radius_miles, hp.hourly_rate, hp.rating, hp.total_jobs, hp.verified
      FROM users u
      JOIN human_profiles hp ON u.id = hp.user_id
      WHERE u.type = 'human'
      ORDER BY hp.rating DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch humans' });
  }
});

// Get human by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.type, u.created_at,
             hp.description, hp.services, hp.location_lat, hp.location_lng,
             hp.radius_miles, hp.hourly_rate, hp.rating, hp.total_jobs, hp.verified
      FROM users u
      JOIN human_profiles hp ON u.id = hp.user_id
      WHERE u.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Human not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch human' });
  }
});

// Update human profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { description, services, location_lat, location_lng, radius_miles, hourly_rate } = req.body;
    
    const result = await pool.query(`
      UPDATE human_profiles
      SET description = COALESCE($1, description),
          services = COALESCE($2, services),
          location_lat = COALESCE($3, location_lat),
          location_lng = COALESCE($4, location_lng),
          radius_miles = COALESCE($5, radius_miles),
          hourly_rate = COALESCE($6, hourly_rate),
          updated_at = NOW()
      WHERE user_id = $7
      RETURNING *
    `, [description, JSON.stringify(services), location_lat, location_lng, radius_miles, hourly_rate, req.user.id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
