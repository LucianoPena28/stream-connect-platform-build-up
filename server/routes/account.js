/**
 * Backend route: /api/account
 *
 * Customer-facing routes (requires JWT auth, no admin role needed):
 * - GET /credentials — Returns the logged-in user's service credentials (decrypted)
 * - GET /profile — Returns user profile
 * - PUT /profile — Update user profile
 */

const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getEncryptionKey() {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key || key.length !== 64) throw new Error('CREDENTIALS_ENCRYPTION_KEY not configured');
  return Buffer.from(key, 'hex');
}

function decrypt(encrypted, ivHex, tagHex) {
  if (!encrypted || !ivHex || !tagHex) return null;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── My Credentials ───────────────────────────────────────────────────────────

router.get('/credentials', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM service_credentials WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const decrypted = rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      service_id: r.service_id,
      service_name: r.service_name,
      username: r.username,
      password: decrypt(r.encrypted_password, r.encryption_iv, r.encryption_tag),
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    res.json(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Profile ──────────────────────────────────────────────────────────────

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT full_name, email, phone, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────

router.put('/profile', authMiddleware, async (req, res) => {
  const { full_name, phone } = req.body;
  try {
    await pool.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name || null, phone || null, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
