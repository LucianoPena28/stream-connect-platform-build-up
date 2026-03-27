/**
 * Employee management routes: /api/employees
 * 
 * Employees are users who have entries in user_roles (admin or support).
 * There is NO separate employees table — data comes from:
 *   users JOIN user_roles LEFT JOIN profiles
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id AS user_id, u.full_name, u.email, u.phone,
              ur.role, ur.created_at,
              u.created_at AS user_created_at, u.updated_at AS user_updated_at
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       ORDER BY ur.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[employees] GET / error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { email, password, full_name, role } = req.body;
  if (!email || !password || !full_name || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['admin', 'support'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already exists' });

    const userId = uuid();
    const hash = await bcrypt.hash(password, 12);
    await pool.query('INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)', [userId, email, hash, full_name]);
    await pool.query('INSERT INTO profiles (id, user_id, full_name, email) VALUES (?, ?, ?, ?)', [uuid(), userId, full_name, email]);
    await pool.query('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuid(), userId, role]);

    res.json({ success: true, user_id: userId });
  } catch (err) {
    console.error('[employees] POST / error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:userId/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE user_roles SET role = ? WHERE user_id = ?', [req.body.role, req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:userId', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM user_roles WHERE user_id = ?', [req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
