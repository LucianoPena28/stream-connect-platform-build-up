const express = require('express');
const pool = require('../db');
const router = express.Router();

/**
 * POST /api/chat
 * Proxies chat messages to the configured LLM endpoint (e.g. self-hosted Llama on Oracle Cloud).
 * The LLM endpoint URL and API key are stored in app_settings so admins can change them from the portal.
 */
router.post('/', async (req, res) => {
  const { message } = req.body;

  try {
    // Fetch LLM config from app_settings
    const [rows] = await pool.query(
      "SELECT `key`, value FROM app_settings WHERE `key` IN ('llm_endpoint', 'llm_api_key', 'llm_model', 'llm_system_prompt', 'llm_max_tokens', 'llm_temperature')"
    );
    const cfg = {};
    rows.forEach(r => { cfg[r.key] = r.value; });

    const endpoint = cfg.llm_endpoint;
    if (!endpoint) {
      return res.json({ reply: "AI assistant is not configured yet. Please ask an admin to set the LLM endpoint in Admin → API Connections." });
    }

    const systemPrompt = cfg.llm_system_prompt || 
      "You are Stream Connect's helpful assistant. We sell Netflix and Spotify subscription plans in Belize (BZD). Be friendly and concise. If asked about pricing, direct users to our Services page.";

    const body = {
      model: cfg.llm_model || 'llama3',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: parseInt(cfg.llm_max_tokens || '512'),
      temperature: parseFloat(cfg.llm_temperature || '0.7'),
      stream: false,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (cfg.llm_api_key) {
      headers['Authorization'] = `Bearer ${cfg.llm_api_key}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LLM error:', response.status, errText);
      return res.json({ reply: "Sorry, I'm having trouble connecting to my brain right now. Try again in a moment!" });
    }

    const data = await response.json();

    // Support both OpenAI-compatible and Ollama response formats
    let reply = '';
    if (data.choices && data.choices[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (data.message?.content) {
      reply = data.message.content;
    } else if (data.response) {
      reply = data.response;
    } else {
      reply = "I received a response but couldn't parse it. Please try again.";
    }

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({ reply: "Sorry, I'm having trouble connecting. Please try again or WhatsApp us at +501 613-9834." });
  }
});

module.exports = router;
