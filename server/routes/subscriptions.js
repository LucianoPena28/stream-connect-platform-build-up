const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
});

module.exports = router;
