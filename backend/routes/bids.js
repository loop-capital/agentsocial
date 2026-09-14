const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// List bids for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as bidder_name, u.email as bidder_email
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      WHERE b.task_id = $1
      ORDER BY b.created_at DESC
    `, [req.params.taskId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Create bid
router.post('/', auth, async (req, res) => {
  try {
    const { task_id, amount, message } = req.body;
    
    // Check if task is open
    const task = await pool.query('SELECT status FROM tasks WHERE id = $1', [task_id]);
    if (task.rows.length === 0 || task.rows[0].status !== 'open') {
      return res.status(400).json({ error: 'Task is not open for bids' });
    }
    
    const result = await pool.query(`
      INSERT INTO bids (task_id, bidder_id, amount, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [task_id, req.user.id, amount, message]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

// Update bid status (accept/reject)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Get bid and check authorization
    const bid = await pool.query('SELECT * FROM bids WHERE id = $1', [req.params.id]);
    if (bid.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    // Check if user is task poster
    const task = await pool.query('SELECT poster_id FROM tasks WHERE id = $1', [bid.rows[0].task_id]);
    if (task.rows[0].poster_id !== req.user.id) {
      return res.status(403).json({ error: 'Only task poster can accept/reject bids' });
    }
    
    const result = await pool.query(`
      UPDATE bids SET status = $1 WHERE id = $2 RETURNING *
    `, [status, req.params.id]);
    
    // If accepted, update task
    if (status === 'accepted') {
      await pool.query(`
        UPDATE tasks SET assigned_to_id = $1, status = 'in_progress' WHERE id = $2
      `, [bid.rows[0].bidder_id, bid.rows[0].task_id]);
      
      // Reject other bids
      await pool.query(`
        UPDATE bids SET status = 'rejected' WHERE task_id = $1 AND id != $2 AND status = 'pending'
      `, [bid.rows[0].task_id, req.params.id]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

module.exports = router;
