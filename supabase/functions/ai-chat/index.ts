const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ reply: "AI assistant is not configured yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the StreamHub Services AI assistant. You help customers in Belize with digital subscription services.

Available plans:
- Netflix Profile: $10 BZD/month (one profile)
- Netflix All 4 Profiles: $30 BZD/month (full account with 4 profiles)
- Spotify Individual: $20 BZD/month (one user)
- Spotify Family: $30 BZD/month (up to 6 accounts)
- Custom apps: contact us for a quote

Payment methods: Shopify checkout, e-Kyash, DigiWallet, Bank Transfer.
All prices are in Belize Dollars (BZD).

How to order: Visit our Services page, add plans to cart, and checkout. We activate your account within hours.

Be friendly, concise, and helpful. If you don't know something, suggest they contact us via WhatsApp or the contact form.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please try again or contact us via WhatsApp!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
