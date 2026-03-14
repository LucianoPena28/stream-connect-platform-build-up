const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const [roles] = await pool.query('SELECT user_id, role, created_at FROM user_roles');
  if (roles.length === 0) return res.json([]);
  const userIds = roles.map(r => r.user_id);
  const placeholders = userIds.map(() => '?').join(',');
  const [profiles] = await pool.query(`SELECT user_id, full_name, email FROM profiles WHERE user_id IN (${placeholders})`, userIds);
  const result = roles.map(r => {
    const p = profiles.find(p => p.user_id === r.user_id);
    return { user_id: r.user_id, role: r.role, email: p?.email || null, full_name: p?.full_name || null, created_at: r.created_at };
  });
  res.json(result);
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { email, password, full_name, role } = req.body;
  if (!email || !password || !full_name || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['admin', 'support'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(409).json({ error: 'Email already exists' });

  const userId = uuid();
  const hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)', [userId, email, hash, full_name]);
  await pool.query('INSERT INTO profiles (id, user_id, full_name, email) VALUES (?, ?, ?, ?)', [uuid(), userId, full_name, email]);
  await pool.query('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuid(), userId, role]);

  res.json({ success: true, user_id: userId });
});

router.put('/:userId/role', authMiddleware, requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE user_roles SET role = ? WHERE user_id = ?', [req.body.role, req.params.userId]);
  res.json({ success: true });
});

router.delete('/:userId', authMiddleware, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM user_roles WHERE user_id = ?', [req.params.userId]);
  res.json({ success: true });
});

module.exports = router;
