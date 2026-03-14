/**
 * Auth routes: login, register, me, update-password, TOTP
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { authenticator } = require('otplib');
const crypto = require('crypto');
const pool = require('../db');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: 'Missing fields' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const id = uuid();
    const hash = await bcrypt.hash(password, 12);
    await pool.query('INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)', [id, email, hash, full_name]);

    // Create profile
    await pool.query('INSERT INTO profiles (id, user_id, full_name, email) VALUES (?, ?, ?, ?)', [uuid(), id, full_name, email]);

    const user = { id, email, full_name, roles: [] };
    res.json({ token: generateToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT id, email, full_name, password_hash FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const [roleRows] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [user.id]);
    const roles = roleRows.map(r => r.role);

    res.json({
      token: generateToken(user),
      user: { id: user.id, email: user.email, full_name: user.full_name, roles },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/update-password
router.post('/update-password', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// TOTP routes
router.get('/totp/status', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT is_enabled FROM totp_secrets WHERE user_id = ?', [req.user.id]);
  const [codes] = await pool.query('SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND is_used = 0', [req.user.id]);
  res.json({ enabled: rows[0]?.is_enabled || false, backupCodesRemaining: codes[0]?.count || 0 });
});

router.post('/totp/setup', authMiddleware, async (req, res) => {
  const secret = authenticator.generateSecret();
  const uri = authenticator.keyuri(req.user.email, 'StreamConnect', secret);
  // Store encrypted secret
  const cipher = crypto.createCipheriv('aes-256-cbc',
    crypto.createHash('sha256').update(process.env.TOTP_ENCRYPTION_KEY || 'default-key').digest(),
    Buffer.alloc(16, 0));
  const encrypted = cipher.update(secret, 'utf8', 'hex') + cipher.final('hex');

  await pool.query('DELETE FROM totp_secrets WHERE user_id = ?', [req.user.id]);
  await pool.query('INSERT INTO totp_secrets (id, user_id, encrypted_secret, is_enabled) VALUES (?, ?, ?, 0)', [uuid(), req.user.id, encrypted]);
  res.json({ uri, secret });
});

router.post('/totp/verify', authMiddleware, async (req, res) => {
  const { code } = req.body;
  const [rows] = await pool.query('SELECT encrypted_secret FROM totp_secrets WHERE user_id = ?', [req.user.id]);
  if (rows.length === 0) return res.status(400).json({ error: 'No TOTP setup found' });

  const decipher = crypto.createDecipheriv('aes-256-cbc',
    crypto.createHash('sha256').update(process.env.TOTP_ENCRYPTION_KEY || 'default-key').digest(),
    Buffer.alloc(16, 0));
  const secret = decipher.update(rows[0].encrypted_secret, 'hex', 'utf8') + decipher.final('utf8');

  if (!authenticator.verify({ token: code, secret })) return res.status(400).json({ error: 'Invalid code' });

  await pool.query('UPDATE totp_secrets SET is_enabled = 1, verified_at = NOW() WHERE user_id = ?', [req.user.id]);

  // Generate backup codes
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push(code);
    const hash = await bcrypt.hash(code, 10);
    await pool.query('INSERT INTO backup_codes (id, user_id, code_hash) VALUES (?, ?, ?)', [uuid(), req.user.id, hash]);
  }

  res.json({ backupCodes });
});

router.post('/totp/disable', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM totp_secrets WHERE user_id = ?', [req.user.id]);
  await pool.query('DELETE FROM backup_codes WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

router.post('/totp/regenerate-codes', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM backup_codes WHERE user_id = ?', [req.user.id]);
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push(code);
    const hash = await bcrypt.hash(code, 10);
    await pool.query('INSERT INTO backup_codes (id, user_id, code_hash) VALUES (?, ?, ?)', [uuid(), req.user.id, hash]);
  }
  res.json({ backupCodes });
});

module.exports = router;
