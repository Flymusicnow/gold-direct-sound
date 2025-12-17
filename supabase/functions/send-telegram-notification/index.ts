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

// Send message to Telegram with retry support
async function sendToTelegram(chatId: string, message: string, parseMode: string = "Markdown"): Promise<{
  ok: boolean;
  result?: any;
  error?: string;
  migrate_to_chat_id?: number;
}> {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  console.log(`[telegram] Sending to chat_id=${chatId}`);
  
  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  });

  const result = await response.json();
  
  // Handle supergroup migration
  if (!response.ok && result.parameters?.migrate_to_chat_id) {
    console.warn(`[telegram] MIGRATION REQUIRED! Current chat_id=${chatId}, new chat_id=${result.parameters.migrate_to_chat_id}`);
    return {
      ok: false,
      error: result.description,
      migrate_to_chat_id: result.parameters.migrate_to_chat_id,
    };
  }
  
  if (!response.ok) {
    console.error(`[telegram] API error: ${result.description}`);
    return { ok: false, error: result.description };
  }
  
  return { ok: true, result: result.result };
}

// Send with retry logic
async function sendWithRetry(chatId: string, message: string): Promise<{
  ok: boolean;
  message_id?: number;
  error?: string;
  retried?: boolean;
  used_migrated_chat_id?: string;
}> {
  // First attempt
  let result = await sendToTelegram(chatId, message);
  
  // If migration required, retry with new chat_id
  if (result.migrate_to_chat_id) {
    const newChatId = String(result.migrate_to_chat_id);
    console.log(`[telegram] Retrying with migrated chat_id=${newChatId}`);
    result = await sendToTelegram(newChatId, message);
    if (result.ok) {
      return {
        ok: true,
        message_id: result.result?.message_id,
        used_migrated_chat_id: newChatId,
      };
    }
  }
  
  // If first attempt failed (not migration), retry after 1 second
  if (!result.ok && !result.migrate_to_chat_id) {
    console.log(`[telegram] First attempt failed, retrying in 1s...`);
    await new Promise(r => setTimeout(r, 1000));
    result = await sendToTelegram(chatId, message);
    if (result.ok) {
      return { ok: true, message_id: result.result?.message_id, retried: true };
    }
  }
  
  if (result.ok) {
    return { ok: true, message_id: result.result?.message_id };
  }
  
  return { ok: false, error: result.error };
}

serve(async (req) => {
  console.log(`[telegram] Function invoked - method=${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if notifications are enabled
  const isEnabled = BUG_NOTIFICATIONS_ENABLED === "true" || BUG_NOTIFICATIONS_ENABLED === "1";
  console.log(`[telegram] BUG_NOTIFICATIONS_ENABLED=${BUG_NOTIFICATIONS_ENABLED}, isEnabled=${isEnabled}`);
  
  if (!isEnabled) {
    console.log("[telegram] Notifications disabled, skipping");
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "disabled" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate secrets
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN");
    return new Response(
      JSON.stringify({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  if (!TELEGRAM_CHAT_ID) {
    console.error("[telegram] Missing TELEGRAM_CHAT_ID");
    return new Response(
      JSON.stringify({ ok: false, error: "Missing TELEGRAM_CHAT_ID" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  console.log(`[telegram] Using chat_id=${TELEGRAM_CHAT_ID}`);

  try {
    const payload: NotificationRequest = await req.json();
    console.log("[telegram] Received payload:", JSON.stringify(payload, null, 2));

    // Format message (compact, readable)
    const truncatedNote = payload.user_note 
      ? payload.user_note.slice(0, 120) + (payload.user_note.length > 120 ? "..." : "")
      : "(no description)";

    const isVerifyTest = payload.inbox_id === "VERIFY_TEST";
    
    const message = isVerifyTest
      ? `✅ *VERIFY_TELEGRAM_OK*\n\nTelegram notifications are working!\n🕐 Time: ${payload.timestamp}`
      : `🚨 *New FlyMusic issue*

📍 Route: \`${payload.route}\`
👤 Role: ${payload.user_role}
📝 Note: "${truncatedNote}"
🕐 Time: ${payload.timestamp}

🔗 [View in Inbox](https://flymusic.se/admin/inbox/${payload.inbox_id})`;

    // Send to Telegram with retry
    const result = await sendWithRetry(TELEGRAM_CHAT_ID, message);
    
    if (!result.ok) {
      console.error("[telegram] Failed after retry:", result.error);
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[telegram] Message sent successfully, message_id=${result.message_id}, retried=${result.retried || false}`);
    
    const responseData: any = { 
      ok: true, 
      message_id: result.message_id,
    };
    
    if (result.retried) {
      responseData.retried = true;
    }
    
    if (result.used_migrated_chat_id) {
      responseData.used_migrated_chat_id = result.used_migrated_chat_id;
      responseData.warning = `UPDATE YOUR TELEGRAM_CHAT_ID to ${result.used_migrated_chat_id}`;
    }
    
    return new Response(
      JSON.stringify(responseData),
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
