const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/profiles/me
router.get('/me', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT full_name, email, avatar_url FROM profiles WHERE user_id = ?', [req.user.id]);
  res.json(rows[0] || { full_name: null, email: null, avatar_url: null });
});

// PUT /api/profiles/me
router.put('/me', authMiddleware, async (req, res) => {
  const { full_name } = req.body;
  await pool.query('UPDATE profiles SET full_name = ?, updated_at = NOW() WHERE user_id = ?', [full_name, req.user.id]);
  const [rows] = await pool.query('SELECT full_name, email, avatar_url FROM profiles WHERE user_id = ?', [req.user.id]);
  res.json(rows[0]);
});

module.exports = router;
