const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT `key`, value FROM app_settings');
  res.json(rows);
});

router.put('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const settings = req.body; // { key: value, ... }
  for (const [key, value] of Object.entries(settings)) {
    const [existing] = await pool.query('SELECT id FROM app_settings WHERE `key` = ?', [key]);
    if (existing.length) {
      await pool.query('UPDATE app_settings SET value = ?, updated_at = NOW() WHERE `key` = ?', [value, key]);
    } else {
      const { v4: uuid } = require('uuid');
      await pool.query('INSERT INTO app_settings (id, `key`, value) VALUES (?, ?, ?)', [uuid(), key, value]);
    }
  }
  res.json({ success: true });
});

module.exports = router;
