const express = require('express');
const { v4: uuid } = require('uuid');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders
router.get('/', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM orders ORDER BY created_at DESC';
  const params = [];
  if (status) { sql = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC'; params.push(status); }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// PUT /api/orders/:id/status
router.put('/:id/status', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
  res.json({ success: true });
});

// POST /api/orders
router.post('/', authMiddleware, async (req, res) => {
  const { customer_name, customer_email, customer_phone, payment_method, items } = req.body;
  if (!customer_name || !customer_email || !items?.length) return res.status(400).json({ error: 'Missing required fields' });

  // Find or create customer
  const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [customer_email]);
  let customerId;
  if (existing.length) { customerId = existing[0].id; }
  else {
    customerId = uuid();
    await pool.query('INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)', [customerId, customer_name, customer_email, customer_phone]);
  }

  const total = items.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
  const orderId = uuid();
  await pool.query(
    'INSERT INTO orders (id, customer_id, customer_name, customer_email, customer_phone, payment_method, total_bzd, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [orderId, customerId, customer_name, customer_email, customer_phone, payment_method || 'shopify', total, 'pending', 'pending']
  );

  for (const item of items) {
    await pool.query(
      'INSERT INTO order_items (id, order_id, service_name, unit_price_bzd, quantity, service_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuid(), orderId, item.name, item.price, item.quantity || 1, item.service_id || null]
    );
  }

  res.json({ order_id: orderId });
});

module.exports = router;
