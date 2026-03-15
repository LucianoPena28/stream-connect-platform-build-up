const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const router = express.Router();

// GET /api/services — list all services (public)
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM services ORDER BY sort_order ASC, created_at DESC');
  res.json(rows);
});

// POST /api/services — create a service (admin only)
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, description, price_bzd, category, billing_period, is_active, sort_order } = req.body;
  const id = uuid();
  await pool.query(
    'INSERT INTO services (id, name, description, price_bzd, category, billing_period, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, description || null, price_bzd || 0, category || null, billing_period || 'monthly', is_active !== false, sort_order || 0]
  );
  res.json({ id });
});

// PUT /api/services/:id — update a service (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, description, price_bzd, category, billing_period, is_active, sort_order } = req.body;
  await pool.query(
    'UPDATE services SET name=?, description=?, price_bzd=?, category=?, billing_period=?, is_active=?, sort_order=?, updated_at=NOW() WHERE id=?',
    [name, description || null, price_bzd || 0, category || null, billing_period || 'monthly', is_active !== false, sort_order || 0, req.params.id]
  );
  res.json({ success: true });
});

// DELETE /api/services/:id — delete a service (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
