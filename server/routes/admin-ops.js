/**
 * Admin AI Operations, Monitoring & n8n Integration
 * 
 * Endpoints:
 *   POST /api/admin/ops/prompt       – Send natural-language prompt to LiteLLM
 *   POST /api/admin/ops/approve      – Approve a proposed action
 *   GET  /api/admin/ops/audit-log    – View audit log
 *   GET  /api/admin/ops/health       – Platform health summary
 *   GET  /api/admin/ops/security     – Security signals summary
 *   POST /api/admin/ops/n8n/webhook  – Signed webhook for n8n
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function callLiteLLM(messages, model) {
  // Load LLM config from DB
  let endpoint = process.env.LITELLM_ENDPOINT || 'http://10.0.0.39:11434';
  let selectedModel = model || 'qwen2.5:0.5b';
  let maxTokens = 2048;
  let temperature = 0.7;

  try {
    const [rows] = await pool.query(
      "SELECT `value` FROM appsettings WHERE `key` IN ('llmconfig', 'llm_config') ORDER BY `key` = 'llmconfig' DESC LIMIT 1"
    );
    if (rows.length > 0 && rows[0].value) {
      const cfg = JSON.parse(rows[0].value);
      if (cfg.endpoint) endpoint = cfg.endpoint;
      if (!model && cfg.model) selectedModel = cfg.model;
      if (cfg.maxTokens) maxTokens = cfg.maxTokens;
      if (cfg.temperature != null) temperature = cfg.temperature;
    }
  } catch (e) {
    console.warn('Failed to load LLM config from DB:', e.message);
  }

  // Determine API format (Ollama vs OpenAI-compatible)
  const isOllama = endpoint.includes(':11434');
  const url = isOllama
    ? `${endpoint}/api/chat`
    : `${endpoint.replace(/\/+$/, '')}/v1/chat/completions`;

  const body = isOllama
    ? { model: selectedModel, messages, stream: false, options: { temperature, num_predict: maxTokens } }
    : { model: selectedModel, messages, max_tokens: maxTokens, temperature, stream: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`LLM error ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const content = isOllama
      ? data.message?.content || ''
      : data.choices?.[0]?.message?.content || '';

    return { content, model: selectedModel, endpoint };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('LLM request timed out after 60s');
    throw err;
  }
}

async function logAudit(userId, action, details) {
  try {
    await pool.query(
      'INSERT INTO admin_audit_log (id, user_id, action, details, created_at) VALUES (UUID(), ?, ?, ?, NOW())',
      [userId, action, JSON.stringify(details)]
    );
  } catch (e) {
    console.error('Audit log write failed:', e.message);
  }
}

// ─── Ensure audit table exists ──────────────────────────────────────────────

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_created (created_at)
      )
    `);
  } catch (e) {
    console.warn('Could not create admin_audit_log table:', e.message);
  }
})();

// ─── AI Prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Stream Connect Admin AI Operations Assistant.
You help platform administrators diagnose issues, review system health, inspect code changes, and propose maintenance actions.

RULES:
- Always be precise and structured in your responses.
- If an action would modify infrastructure, data, or configuration, you MUST clearly label it as a "PROPOSED ACTION" and list the exact steps. Do NOT execute it directly.
- For read-only diagnostics, provide the information directly.
- Categorize your response sections using markdown headers.
- When you detect potential security issues, flag them prominently.
- If you cannot determine something from available context, say so clearly rather than guessing.

CAPABILITIES you can help with:
- Reviewing API/DB health status
- Analyzing logs and error patterns
- Summarizing code changes and diffs
- Detecting suspicious patterns (auth failures, traffic spikes)
- Proposing remediation steps for common issues
- Generating deployment checklists

You do NOT have direct access to run shell commands. You provide analysis and recommendations that the admin can then execute.`;

router.post('/prompt', authMiddleware, requireRole('admin'), async (req, res) => {
  const { prompt, model, context } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 5000) {
    return res.status(400).json({ error: 'Prompt required (max 5000 chars)' });
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add platform context if provided
    if (context) {
      messages.push({ role: 'system', content: `Current platform context:\n${JSON.stringify(context)}` });
    }

    messages.push({ role: 'user', content: prompt });

    const result = await callLiteLLM(messages, model);

    // Detect if response contains proposed actions
    const hasProposedActions = /PROPOSED ACTION|⚠️.*action|requires approval/i.test(result.content);

    await logAudit(req.user.id, 'ai_prompt', {
      prompt: prompt.slice(0, 500),
      model: result.model,
      hasProposedActions,
      responseLength: result.content.length,
    });

    res.json({
      response: result.content,
      model: result.model,
      hasProposedActions,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('AI ops prompt error:', err.message);
    await logAudit(req.user.id, 'ai_prompt_error', { prompt: prompt.slice(0, 200), error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── Approve Action ─────────────────────────────────────────────────────────

router.post('/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  const { actionId, actionDescription } = req.body;
  if (!actionId || !actionDescription) {
    return res.status(400).json({ error: 'actionId and actionDescription required' });
  }

  await logAudit(req.user.id, 'action_approved', { actionId, actionDescription });

  // TODO: When shell/PM2/git execution layer is added, dispatch approved action here
  // For now, we just log the approval
  res.json({
    status: 'approved',
    message: 'Action approved and logged. Manual execution required for infrastructure changes.',
    actionId,
    timestamp: new Date().toISOString(),
  });
});

// ─── Audit Log ──────────────────────────────────────────────────────────────

router.get('/audit-log', authMiddleware, requireRole('admin'), async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const [rows] = await pool.query(
      `SELECT al.*, u.email as user_email, u.full_name as user_name
       FROM admin_audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM admin_audit_log');

    res.json({ entries: rows, total: countResult[0].total });
  } catch (err) {
    console.error('Audit log fetch error:', err.message);
    res.json({ entries: [], total: 0 });
  }
});

// ─── Platform Health ────────────────────────────────────────────────────────

router.get('/health', authMiddleware, requireRole('admin', 'support'), async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    database: { status: 'unknown', latency: null },
    llm: { status: 'unknown', endpoint: null, model: null },
    api: { status: 'online', uptime: process.uptime(), memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) },
    recentErrors: [],
    authFailures: { last24h: 0 },
    requestMetrics: { note: 'Requires nginx log parsing or middleware instrumentation for full metrics' },
  };

  // Check DB
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    health.database = { status: 'connected', latency: Date.now() - start };
  } catch (e) {
    health.database = { status: 'error', error: e.message };
  }

  // Check LLM
  try {
    let endpoint = process.env.LITELLM_ENDPOINT || 'http://10.0.0.39:11434';
    try {
      const [rows] = await pool.query("SELECT `value` FROM appsettings WHERE `key` = 'llmconfig' LIMIT 1");
      if (rows.length > 0 && rows[0].value) {
        const cfg = JSON.parse(rows[0].value);
        if (cfg.endpoint) endpoint = cfg.endpoint;
        health.llm.model = cfg.model || null;
      }
    } catch (_) {}

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`${endpoint}/api/tags`, { signal: controller.signal });
    clearTimeout(t);

    health.llm.status = resp.ok ? 'online' : 'error';
    health.llm.endpoint = endpoint;

    if (resp.ok) {
      const data = await resp.json();
      health.llm.availableModels = (data.models || []).map(m => m.name).slice(0, 10);
    }
  } catch (e) {
    health.llm.status = 'offline';
    health.llm.error = e.message;
  }

  // Auth failures (last 24h from audit log)
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM admin_audit_log WHERE action LIKE '%login_fail%' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    health.authFailures.last24h = rows[0]?.cnt || 0;
  } catch (_) {}

  res.json(health);
});

// ─── Security Signals ───────────────────────────────────────────────────────

router.get('/security', authMiddleware, requireRole('admin'), async (req, res) => {
  const signals = {
    timestamp: new Date().toISOString(),
    findings: [],
    recommendations: [],
  };

  // Check for repeated auth failures
  try {
    const [rows] = await pool.query(
      `SELECT details, COUNT(*) as attempts, MAX(created_at) as last_attempt
       FROM admin_audit_log
       WHERE action LIKE '%login_fail%'
       AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY JSON_EXTRACT(details, '$.email')
       HAVING attempts >= 3
       ORDER BY attempts DESC
       LIMIT 20`
    );
    if (rows.length > 0) {
      signals.findings.push({
        severity: 'warning',
        type: 'brute_force_suspect',
        title: 'Multiple failed login attempts detected',
        detail: `${rows.length} account(s) with 3+ failed attempts in last 24h`,
        data: rows.map(r => ({ attempts: r.attempts, lastAttempt: r.last_attempt })),
      });
    }
  } catch (_) {}

  // Check for admin accounts without 2FA
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN totp_secrets ts ON ts.user_id = u.id AND ts.is_enabled = 1
       WHERE ur.role IN ('admin', 'support')
       AND ts.id IS NULL`
    );
    if (rows.length > 0) {
      signals.findings.push({
        severity: 'warning',
        type: 'missing_2fa',
        title: 'Staff accounts without 2FA',
        detail: `${rows.length} admin/support account(s) do not have 2FA enabled`,
        data: rows.map(r => ({ email: r.email, name: r.full_name })),
      });
    }
  } catch (_) {}

  // Check DB user count growth
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as newUsers FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    if (rows[0]?.newUsers > 50) {
      signals.findings.push({
        severity: 'info',
        type: 'user_spike',
        title: 'Unusual user registration volume',
        detail: `${rows[0].newUsers} new registrations in last 24h`,
      });
    }
  } catch (_) {}

  // Standing recommendations
  signals.recommendations = [
    { priority: 'high', text: 'Enable rate limiting on /api/auth/login and /api/auth/register endpoints' },
    { priority: 'high', text: 'Ensure all admin/staff accounts have 2FA enabled' },
    { priority: 'medium', text: 'Configure Nginx rate_limit zones for API endpoints' },
    { priority: 'medium', text: 'Set up fail2ban or equivalent for SSH and API brute-force protection' },
    { priority: 'low', text: 'Review Nginx access logs for unusual user agents or IP patterns' },
    { priority: 'low', text: 'Consider adding CORS origin restrictions beyond wildcard' },
  ];

  res.json(signals);
});

// ─── n8n Webhook ────────────────────────────────────────────────────────────

router.post('/n8n/webhook', async (req, res) => {
  // Verify webhook signature if N8N_WEBHOOK_SECRET is set
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers['x-n8n-signature'] || req.headers['x-webhook-signature'];
    if (!signature) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (signature !== expected) {
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }
  }

  const { event, data } = req.body;
  if (!event) {
    return res.status(400).json({ error: 'event field required' });
  }

  console.log(`[n8n webhook] event=${event}`, JSON.stringify(data || {}).slice(0, 500));

  // Handle known events
  switch (event) {
    case 'health_check':
      try {
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
      } catch (e) {
        res.json({ status: 'unhealthy', error: e.message, timestamp: new Date().toISOString() });
      }
      break;

    case 'trigger_diagnostic':
      // n8n can trigger a diagnostic run
      try {
        const [dbCheck] = await pool.query('SELECT COUNT(*) as users FROM users');
        const [orderCheck] = await pool.query('SELECT COUNT(*) as orders FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        res.json({
          status: 'ok',
          diagnostics: {
            totalUsers: dbCheck[0].users,
            ordersLast24h: orderCheck[0].orders,
            apiUptime: process.uptime(),
            memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          },
        });
      } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
      }
      break;

    case 'notify_deployment':
      // Log deployment notification
      try {
        await pool.query(
          'INSERT INTO admin_audit_log (id, user_id, action, details, created_at) VALUES (UUID(), ?, ?, ?, NOW())',
          ['system', 'n8n_deployment_notify', JSON.stringify(data || {})]
        );
      } catch (_) {}
      res.json({ status: 'received' });
      break;

    default:
      res.json({ status: 'received', event });
  }
});

// ─── Outbound n8n trigger helper ────────────────────────────────────────────

router.post('/n8n/trigger', authMiddleware, requireRole('admin'), async (req, res) => {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    return res.status(400).json({ error: 'N8N_WEBHOOK_URL not configured. Set it in your backend .env file.' });
  }

  const { workflow, payload } = req.body;
  if (!workflow) {
    return res.status(400).json({ error: 'workflow name required' });
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow, payload, source: 'streamconnect-admin', timestamp: new Date().toISOString() }),
      signal: controller.signal,
    });
    clearTimeout(t);

    const data = await resp.json().catch(() => ({ status: resp.status }));
    await logAudit(req.user.id, 'n8n_trigger', { workflow, status: resp.status });
    res.json({ status: 'sent', n8nResponse: data });
  } catch (err) {
    res.status(500).json({ error: `n8n trigger failed: ${err.message}` });
  }
});

module.exports = router;
