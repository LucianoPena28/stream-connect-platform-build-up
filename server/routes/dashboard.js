const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  const [[{ orderCount }]] = await pool.query('SELECT COUNT(*) as orderCount FROM orders');
  const [[{ revenue }]] = await pool.query('SELECT COALESCE(SUM(total_bzd), 0) as revenue FROM orders');
  const [[{ customerCount }]] = await pool.query('SELECT COUNT(*) as customerCount FROM customers');
  const [[{ ticketCount }]] = await pool.query("SELECT COUNT(*) as ticketCount FROM tickets WHERE status = 'open'");
  const [recentOrders] = await pool.query('SELECT id, customer_name, total_bzd, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5');

  res.json({
    orders: orderCount,
    revenue: Number(revenue),
    customers: customerCount,
    tickets: ticketCount,
    recentOrders,
  });
});

module.exports = router;
