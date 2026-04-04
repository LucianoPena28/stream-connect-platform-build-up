/**
 * Stream Connect API Server
 * Runs on Oracle Cloud, connects to Oracle MySQL.
 *
 * Usage:
 *   cp .env.example .env  (fill in your values)
 *   npm install
 *   npm run dev   (development with nodemon)
 *   npm start     (production)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/services', require('./routes/services'));
app.use('/api/account', require('./routes/account'));
app.use('/api/admin/ops', require('./routes/admin-ops'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Stream Connect API running on port ${PORT}`);
});
