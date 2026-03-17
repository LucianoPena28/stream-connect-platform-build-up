/**
 * Backend route: /api/admin/customers
 * 
 * Handles admin customer management including:
 * - POST /        — Create a new customer (hash password, insert into users + user_roles)
 * - GET /:id/credentials — Get all service credentials for a customer (AES-256-GCM decrypted)
 * - POST /:id/credentials — Create a new credential (encrypt password)
 * - PUT /:id/credentials/:credId — Update a credential
 * - DELETE /:id/credentials/:credId — Delete a credential
 * - POST /:id/send-reset — Generate a password reset token and send email
 * - DELETE /:id — Delete a customer
 *
 * Required env vars:
 *   CREDENTIALS_ENCRYPTION_KEY — 32-byte hex string for AES-256-GCM
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM — for sending reset emails
 *
 * Required MySQL tables:
 *
 * CREATE TABLE IF NOT EXISTS service_credentials (
 *   id VARCHAR(36) PRIMARY KEY,
 *   user_id VARCHAR(36) NOT NULL,
 *   service_id VARCHAR(36) NULL,
 *   service_name VARCHAR(255) NOT NULL,
 *   username VARCHAR(255),
 *   encrypted_password TEXT,
 *   encryption_iv VARCHAR(64),
 *   encryption_tag VARCHAR(64),
 *   notes TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   INDEX idx_user_id (user_id),
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 *
 * CREATE TABLE IF NOT EXISTS password_reset_tokens (
 *   id VARCHAR(36) PRIMARY KEY,
 *   user_id VARCHAR(36) NOT NULL,
 *   token VARCHAR(255) NOT NULL UNIQUE,
 *   expires_at TIMESTAMP NOT NULL,
 *   used_at TIMESTAMP NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   INDEX idx_token (token),
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEncryptionKey() {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key || key.length !== 64) throw new Error('CREDENTIALS_ENCRYPTION_KEY must be a 32-byte hex string');
  return Buffer.from(key, 'hex');
}

function encrypt(plaintext) {
  if (!plaintext) return { encrypted: null, iv: null, tag: null };
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), tag };
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

// ─── List Customers ───────────────────────────────────────────────────────────

router.get('/', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.phone, 
              COALESCE(ur.role, 'customer') AS role, u.created_at
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create Customer ──────────────────────────────────────────────────────────

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !password) return res.status(400).json({ error: 'full_name, email, and password are required' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'A user with this email already exists' });

    const id = crypto.randomUUID();
    const hashed = await bcrypt.hash(password, 12);
    await pool.query(
      'INSERT INTO users (id, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
      [id, full_name, email, phone || null, hashed]
    );
    // Default role is customer (no entry in user_roles)
    res.status(201).json({ id, email, tempPassword: password });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete Customer ──────────────────────────────────────────────────────────

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Credentials (decrypted) ──────────────────────────────────────────────

router.get('/:id/credentials', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM service_credentials WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.id]
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

// ─── Create Credential ───────────────────────────────────────────────────────

router.post('/:id/credentials', authMiddleware, requireRole('admin'), async (req, res) => {
  const { service_name, service_id, username, password, notes } = req.body;
  if (!service_name) return res.status(400).json({ error: 'service_name is required' });

  try {
    const id = crypto.randomUUID();
    const { encrypted, iv, tag } = encrypt(password || '');
    await pool.query(
      `INSERT INTO service_credentials (id, user_id, service_id, service_name, username, encrypted_password, encryption_iv, encryption_tag, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, service_id || null, service_name, username || null, encrypted, iv, tag, notes || null]
    );
    res.status(201).json({ id, user_id: req.params.id, service_id, service_name, username, password, notes, created_at: new Date(), updated_at: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Credential ───────────────────────────────────────────────────────

router.put('/:id/credentials/:credId', authMiddleware, requireRole('admin'), async (req, res) => {
  const { service_name, service_id, username, password, notes } = req.body;
  try {
    const { encrypted, iv, tag } = encrypt(password || '');
    await pool.query(
      `UPDATE service_credentials SET service_name = ?, service_id = ?, username = ?, encrypted_password = ?, encryption_iv = ?, encryption_tag = ?, notes = ? WHERE id = ? AND user_id = ?`,
      [service_name, service_id || null, username || null, encrypted, iv, tag, notes || null, req.params.credId, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete Credential ───────────────────────────────────────────────────────

router.delete('/:id/credentials/:credId', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM service_credentials WHERE id = ? AND user_id = ?', [req.params.credId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Send Password Reset ─────────────────────────────────────────────────────

router.post('/:id/send-reset', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ error: 'Customer not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [id, req.params.id, token, expiresAt]
    );

    // Send email via nodemailer if SMTP is configured
    const resetUrl = `https://streamconnect.online/account/reset-password?token=${token}`;
    
    if (process.env.SMTP_HOST) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@streamconnect.online',
        to: users[0].email,
        subject: 'Stream Connect — Reset Your Password',
        html: `<p>Hi ${users[0].full_name || ''},</p>
               <p>A password reset was requested for your account. Click the link below to set a new password:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>This link expires in 24 hours. If you didn't request this, please ignore this email.</p>
               <p>— Stream Connect Team</p>`,
      });
    }

    res.json({ message: `Reset link sent to ${users[0].email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
