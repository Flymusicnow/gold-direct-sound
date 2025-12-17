import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const BUG_NOTIFICATIONS_ENABLED = Deno.env.get("BUG_NOTIFICATIONS_ENABLED");

interface NotificationRequest {
  inbox_id: string;
  title: string;
  route: string;
  user_role: string;
  user_note?: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if notifications are enabled
  if (BUG_NOTIFICATIONS_ENABLED !== "true") {
    console.log("[telegram] Notifications disabled, skipping");
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "disabled" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate secrets
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Telegram configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: NotificationRequest = await req.json();
    console.log("[telegram] Sending notification for inbox:", payload.inbox_id);

    // Format message (compact, readable)
    const truncatedNote = payload.user_note 
      ? payload.user_note.slice(0, 120) + (payload.user_note.length > 120 ? "..." : "")
      : "(no description)";

    const message = `🚨 *New FlyMusic issue*

📍 Route: \`${payload.route}\`
👤 Role: ${payload.user_role}
📝 Note: "${truncatedNote}"
🕐 Time: ${payload.timestamp}

🔗 [View in Inbox](https://flymusic.se/admin/inbox/${payload.inbox_id})`;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    const result = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error("[telegram] API error:", result);
      return new Response(
        JSON.stringify({ ok: false, error: result.description }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[telegram] Message sent successfully, message_id:", result.result?.message_id);
    
    return new Response(
      JSON.stringify({ ok: true, message_id: result.result?.message_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[telegram] Unhandled error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
