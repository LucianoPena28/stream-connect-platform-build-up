import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "npm:otpauth@9.2.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { action, code } = await req.json();

  if (action === "setup") {
    const totp = new OTPAuth.TOTP({
      issuer: "StreamHub",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    await supabase.from("totp_secrets").upsert({
      user_id: user.id,
      encrypted_secret: secret,
      is_enabled: false,
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ secret, uri }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "verify") {
    const { data: totpData } = await supabase
      .from("totp_secrets")
      .select("encrypted_secret")
      .eq("user_id", user.id)
      .single();

    if (!totpData) return new Response(JSON.stringify({ error: "No TOTP setup found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const totp = new OTPAuth.TOTP({
      issuer: "StreamHub",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(totpData.encrypted_secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return new Response(JSON.stringify({ error: "Invalid code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supabase.from("totp_secrets").update({
      is_enabled: true,
      verified_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    // Generate 10 backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      backupCodes.push(
        Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase()
      );
    }

    await supabase.from("backup_codes").delete().eq("user_id", user.id);
    await supabase.from("backup_codes").insert(
      backupCodes.map(c => ({ user_id: user.id, code_hash: c, is_used: false }))
    );

    return new Response(JSON.stringify({ success: true, backupCodes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "disable") {
    await supabase.from("totp_secrets").delete().eq("user_id", user.id);
    await supabase.from("backup_codes").delete().eq("user_id", user.id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "status") {
    const { data } = await supabase
      .from("totp_secrets")
      .select("is_enabled, verified_at")
      .eq("user_id", user.id)
      .single();

    const { data: codes } = await supabase
      .from("backup_codes")
      .select("id, is_used")
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      enabled: data?.is_enabled || false,
      verifiedAt: data?.verified_at,
      backupCodesRemaining: codes?.filter(c => !c.is_used).length || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "regenerate-codes") {
    const { data: totpData } = await supabase
      .from("totp_secrets")
      .select("is_enabled")
      .eq("user_id", user.id)
      .single();

    if (!totpData?.is_enabled) return new Response(JSON.stringify({ error: "2FA not enabled" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const backupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      backupCodes.push(
        Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase()
      );
    }

    await supabase.from("backup_codes").delete().eq("user_id", user.id);
    await supabase.from("backup_codes").insert(
      backupCodes.map(c => ({ user_id: user.id, code_hash: c, is_used: false }))
    );

    return new Response(JSON.stringify({ backupCodes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
