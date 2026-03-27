/**
 * Backend route: /api/account
 *
 * Customer-facing routes (requires JWT auth):
 * - GET /credentials — masked credentials (no passwords)
 * - POST /credentials/verify — step-up auth to reveal a credential
 * - GET /profile — user profile
 * - PUT /profile — update profile
 * - GET /subscriptions — user's subscriptions
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
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

// ─── My Credentials (masked — no passwords) ──────────────────────────────────

router.get('/credentials', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id, service_id, service_name, username, notes, created_at, updated_at FROM service_credentials WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    // Return credentials WITHOUT passwords — require step-up auth to reveal
    res.json(rows.map(r => ({
      ...r,
      password: null, // masked
      has_password: !!(r.encrypted_password || true), // always true if record exists
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Step-up verify to reveal a credential ────────────────────────────────────

router.post('/credentials/verify', authMiddleware, async (req, res) => {
  const { credential_id, password, otp_code } = req.body;
  if (!credential_id || !password) return res.status(400).json({ error: 'credential_id and password are required' });

  try {
    // 1. Verify account password
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(401).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, users[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    // 2. Check if 2FA is enabled — if so, require OTP
    const [totp] = await pool.query('SELECT encrypted_secret, is_enabled FROM totp_secrets WHERE user_id = ?', [req.user.id]);
    if (totp.length > 0 && totp[0].is_enabled) {
      if (!otp_code) return res.status(403).json({ error: '2FA is enabled — OTP code required', requires_otp: true });

      // Decrypt TOTP secret and verify
      const decipher = crypto.createDecipheriv('aes-256-cbc',
        crypto.createHash('sha256').update(process.env.TOTP_ENCRYPTION_KEY || 'default-key').digest(),
        Buffer.alloc(16, 0));
      const secret = decipher.update(totp[0].encrypted_secret, 'hex', 'utf8') + decipher.final('utf8');

      if (!authenticator.verify({ token: otp_code, secret })) {
        // Try backup codes
        const [codes] = await pool.query('SELECT id, code_hash FROM backup_codes WHERE user_id = ? AND is_used = 0', [req.user.id]);
        let backupMatch = false;
        for (const c of codes) {
          if (await bcrypt.compare(otp_code, c.code_hash)) {
            await pool.query('UPDATE backup_codes SET is_used = 1, used_at = NOW() WHERE id = ?', [c.id]);
            backupMatch = true;
            break;
          }
        }
        if (!backupMatch) return res.status(401).json({ error: 'Invalid OTP code' });
      }
    }

    // 3. Fetch and decrypt the credential
    const [creds] = await pool.query(
      'SELECT * FROM service_credentials WHERE id = ? AND user_id = ?',
      [credential_id, req.user.id]
    );
    if (creds.length === 0) return res.status(404).json({ error: 'Credential not found' });

    const cred = creds[0];
    const decryptedPassword = decrypt(cred.encrypted_password, cred.encryption_iv, cred.encryption_tag);

    // 4. Log the reveal event
    console.log(`[audit] Credential ${credential_id} revealed by user ${req.user.id} at ${new Date().toISOString()}`);

    res.json({
      id: cred.id,
      service_name: cred.service_name,
      username: cred.username,
      password: decryptedPassword,
      notes: cred.notes,
    });
  } catch (err) {
    console.error('[account] credential verify error:', err.message);
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
