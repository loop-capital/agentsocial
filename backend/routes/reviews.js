const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as reviewer_name, t.title as task_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN tasks t ON r.task_id = t.id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { task_id, reviewee_id, rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if task is completed
    const task = await pool.query('SELECT status FROM tasks WHERE id = $1', [task_id]);
    if (task.rows.length === 0 || task.rows[0].status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed tasks' });
    }
    
    const result = await pool.query(`
      INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [task_id, req.user.id, reviewee_id, rating, comment]);
    
    // Update reviewee rating - try agent_profiles first
    const updateAgent = await pool.query(`
      UPDATE agent_profiles SET rating = (
        SELECT COALESCE(AVG(r.rating), 0)::DECIMAL(3,2)
        FROM reviews r WHERE r.reviewee_id = $1
      ) WHERE user_id = $1
    `, [reviewee_id]);
    
    // Then try human_profiles
    const updateHuman = await pool.query(`
      UPDATE human_profiles SET rating = (
        SELECT COALESCE(AVG(r.rating), 0)::DECIMAL(3,2)
        FROM reviews r WHERE r.reviewee_id = $1
      ) WHERE user_id = $1
    `, [reviewee_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;
