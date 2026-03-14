const express = require('express');
const router = express.Router();

// Placeholder — integrate your AI provider here
router.post('/', async (req, res) => {
  const { message } = req.body;
  // TODO: Connect to your AI provider (OpenAI, etc.)
  res.json({
    reply: `Thanks for your message! Our team will help you with: "${message}". For immediate assistance, WhatsApp us at +501 613-9834.`
  });
});

module.exports = router;
