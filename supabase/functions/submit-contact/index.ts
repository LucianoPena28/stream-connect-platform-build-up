import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find or create customer
    let customerId: string | null = null;
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      customerId = existing.id;
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({ name, email })
        .select("id")
        .single();
      customerId = newCustomer?.id || null;
    }

    // Create ticket
    const { error } = await supabase.from("tickets").insert({
      customer_id: customerId,
      subject,
      message,
      customer_name: name,
      customer_email: email,
      source: "contact_form",
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
