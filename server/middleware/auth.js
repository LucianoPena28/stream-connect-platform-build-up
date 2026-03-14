/**
 * JWT auth middleware — verifies Bearer token and attaches req.user
 */
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const [rows] = await pool.query('SELECT id, email, full_name FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const [roleRows] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [decoded.id]);
    req.user = { ...rows[0], roles: roleRows.map(r => r.role) };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.roles?.some(r => roles.includes(r))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, generateToken, JWT_SECRET };
