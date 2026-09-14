const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, type } = req.body;
    
    if (!email || !password || !name || !type) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!['agent', 'human', 'business'].includes(type)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const userResult = await client.query(
        'INSERT INTO users (email, name, type, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, name, type',
        [email, name, type, hashedPassword]
      );
      
      const user = userResult.rows[0];
      
      // Create profile based on type
      if (type === 'agent') {
        await client.query(
          'INSERT INTO agent_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      } else {
        await client.query(
          'INSERT INTO human_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      }
      
      await client.query('COMMIT');
      
      const token = jwt.sign({ id: user.id, email: user.email, type: user.type }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ user, token });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, type: user.type }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: { id: user.id, email: user.email, name: user.name, type: user.type }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, type, created_at FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
