const express = require('express');
const { v4: uuid } = require('uuid');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM tickets ORDER BY created_at DESC';
  const params = [];
  if (status) { sql = 'SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC'; params.push(status); }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.put('/:id/status', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  await pool.query('UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

// Public contact form submission
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields required' });

  // Find or create customer
  const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
  let customerId;
  if (existing.length) { customerId = existing[0].id; }
  else {
    customerId = uuid();
    await pool.query('INSERT INTO customers (id, name, email) VALUES (?, ?, ?)', [customerId, name, email]);
  }

  await pool.query(
    'INSERT INTO tickets (id, customer_id, subject, message, customer_name, customer_email, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuid(), customerId, subject, message, name, email, 'contact_form']
  );
  res.json({ success: true });
});

module.exports = router;
