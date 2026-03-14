const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
  res.json(rows);
});

module.exports = router;
