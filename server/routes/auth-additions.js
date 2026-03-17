/**
 * Auth route additions for password reset:
 *
 * Add these routes to the existing server/routes/auth.js file:
 *
 * POST /api/auth/forgot-password — accepts { email }, creates reset token, sends email
 * POST /api/auth/reset-password — accepts { token, newPassword }, validates token, updates password
 *
 * --- Copy the following code and add it to auth.js before module.exports ---
 */

/*
// ─── Forgot Password ─────────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [users] = await pool.query('SELECT id, full_name, email FROM users WHERE email = ?', [email]);
    // Always return success to prevent email enumeration
    if (users.length === 0) return res.json({ message: 'If an account exists, a reset link has been sent.' });

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [id, user.id, token, expiresAt]
    );

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
        to: user.email,
        subject: 'Stream Connect — Reset Your Password',
        html: `<p>Hi ${user.full_name || ''},</p>
               <p>Click below to reset your password:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>This link expires in 24 hours.</p>
               <p>— Stream Connect Team</p>`,
      });
    }

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reset Password ──────────────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const [tokens] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()',
      [token]
    );
    if (tokens.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const resetToken = tokens[0];
    const hashed = await bcrypt.hash(newPassword, 12);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, resetToken.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [resetToken.id]);

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
*/
