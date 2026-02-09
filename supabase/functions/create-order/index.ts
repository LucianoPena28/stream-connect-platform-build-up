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
    const { customer_name, customer_email, customer_phone, payment_method, items } = await req.json();

    if (!customer_name || !customer_email || !items?.length) {
      return new Response(JSON.stringify({ error: "Name, email, and at least one item required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find or create customer
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customer_email)
      .maybeSingle();

    let customerId: string;
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: newCust } = await supabase
        .from("customers")
        .insert({ name: customer_name, email: customer_email, phone: customer_phone })
        .select("id")
        .single();
      customerId = newCust!.id;
    }

    // Calculate total
    const total = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        customer_name,
        customer_email,
        customer_phone,
        payment_method: payment_method || "shopify",
        total_bzd: total,
        status: payment_method === "shopify" ? "pending" : "pending",
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: { name: string; price: number; quantity: number; service_id?: string }) => ({
      order_id: order!.id,
      service_name: item.name,
      unit_price_bzd: item.price,
      quantity: item.quantity || 1,
      service_id: item.service_id || null,
    }));

    await supabase.from("order_items").insert(orderItems);

    return new Response(JSON.stringify({ success: true, order_id: order!.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to create order" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
