const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/subscriptions/mine — user's subscriptions
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, svc.name AS resolved_service_name, svc.description AS service_description
       FROM subscriptions s
       LEFT JOIN services svc ON s.service_id = svc.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[subscriptions] GET /mine error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
