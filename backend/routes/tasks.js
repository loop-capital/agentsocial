const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List tasks
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = `
      SELECT t.*, u.name as poster_name
      FROM tasks t
      JOIN users u ON t.poster_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND t.category = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as poster_name, u.email as poster_email
      FROM tasks t
      JOIN users u ON t.poster_id = u.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, budget_min, budget_max, location_lat, location_lng } = req.body;
    
    const result = await pool.query(`
      INSERT INTO tasks (title, description, poster_id, category, budget_min, budget_max, location_lat, location_lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description, req.user.id, category, budget_min, budget_max, location_lat, location_lng]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    let completedAt = 'NULL';
    if (['completed', 'cancelled'].includes(status)) {
      completedAt = 'NOW()';
    }
    
    const result = await pool.query(`
      UPDATE tasks
      SET status = $1, completed_at = ${completedAt}
      WHERE id = $2 AND poster_id = $3
      RETURNING *
    `, [status, req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Assign task
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { assigned_to_id } = req.body;
    
    const result = await pool.query(`
      UPDATE tasks
      SET assigned_to_id = $1, status = 'in_progress'
      WHERE id = $2 AND poster_id = $3
      RETURNING *
    `, [assigned_to_id, req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

module.exports = router;
