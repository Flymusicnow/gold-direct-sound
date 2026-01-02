import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";

import { EmailVerifyEmail } from "./_templates/email-verify.tsx";
import { MagicLinkEmail } from "./_templates/magic-link.tsx";
import { PasswordRecoveryEmail } from "./_templates/password-recovery.tsx";
import { EmailChangeEmail } from "./_templates/email-change.tsx";
import { PasswordChangedEmail } from "./_templates/password-changed.tsx";
import { InviteEmail } from "./_templates/invite.tsx";
import { type Locale, generatePlainText, getTranslation } from "./_templates/_shared/translations.ts";

// Initialize clients
const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("FLYMUSIC_AUTH_EMAIL_HOOK_SECRET") as string;
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Event type mapping: hook events → normalized events
const EVENT_MAP: Record<string, string> = {
  signup: "EMAIL_VERIFY",
  magiclink: "MAGIC_LINK",
  recovery: "PASSWORD_RECOVERY",
  email_change: "EMAIL_CHANGE",
  password_changed: "PASSWORD_CHANGED",
  invite: "INVITE",
};

// Rate limiting config
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;

// Hash email for logging (anti-enumeration)
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate correlation ID
function generateCorrelationId(): string {
  return crypto.randomUUID();
}

// Check rate limit
async function isRateLimited(
  supabase: any,
  emailHash: string,
  event: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { count } = await supabase
    .from("auth_email_events")
    .select("*", { count: "exact", head: true })
    .eq("email_hash", emailHash)
    .eq("event", event)
    .gte("created_at", windowStart);

  return (count || 0) >= RATE_LIMIT_MAX;
}

// Log email event
async function logEmailEvent(
  supabase: any,
  data: {
    correlationId: string;
    userId?: string;
    emailHash: string;
    event: string;
    locale: string;
    status: string;
    providerMessageId?: string;
    errorCode?: string;
  }
): Promise<void> {
  await supabase.from("auth_email_events").insert({
    correlation_id: data.correlationId,
    user_id: data.userId,
    email_hash: data.emailHash,
    event: data.event,
    locale: data.locale,
    status: data.status,
    provider_message_id: data.providerMessageId,
    error_code: data.errorCode,
  });
}

// Resolve locale from multiple sources
async function resolveLocale(
  supabase: any,
  payload: NormalizedPayload
): Promise<Locale> {
  // 1. Check payload.locale
  if (payload.locale === "sv" || payload.locale === "en") {
    return payload.locale;
  }

  // 2. Parse from confirmation_url (?lang=sv)
  if (payload.confirmation_url) {
    try {
      const url = new URL(payload.confirmation_url);
      const lang = url.searchParams.get("lang");
      if (lang === "sv" || lang === "en") {
        return lang;
      }
    } catch {
      // Invalid URL, continue
    }
  }

  // 3. Lookup user language preference
  if (payload.user_id) {
    const { data } = await supabase
      .from("profiles")
      .select("language")
      .eq("id", payload.user_id)
      .single();
    
    if (data?.language === "sv" || data?.language === "en") {
      return data.language;
    }
  }

  // 4. Fallback
  return "en";
}

// Normalized payload interface
interface NormalizedPayload {
  event: string;
  email: string;
  confirmation_url?: string;
  user_id?: string;
  user_name?: string;
  locale?: string;
  invite_code?: string;
}

// Parse and normalize incoming payload
function normalizePayload(body: any): NormalizedPayload | null {
  // Handle Supabase Auth Hook format
  if (body.user && body.email_data) {
    const rawEvent = body.email_data.email_action_type;
    const event = EVENT_MAP[rawEvent] || rawEvent;
    
    return {
      event,
      email: body.user.email,
      confirmation_url: buildConfirmationUrl(body.email_data),
      user_id: body.user.id,
      user_name: body.user.user_metadata?.full_name || body.user.user_metadata?.name,
      locale: body.user.user_metadata?.language,
      invite_code: body.email_data.token,
    };
  }

  // Handle direct/normalized format
  if (body.event && body.email) {
    const event = EVENT_MAP[body.event] || body.event;
    return {
      event,
      email: body.email,
      confirmation_url: body.confirmation_url,
      user_id: body.user_id,
      user_name: body.user_name,
      locale: body.locale,
      invite_code: body.invite_code,
    };
  }

  return null;
}

// Build confirmation URL from email_data
function buildConfirmationUrl(emailData: any): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  return `${supabaseUrl}/auth/v1/verify?token=${emailData.token_hash}&type=${emailData.email_action_type}&redirect_to=${emailData.redirect_to}`;
}

// Render email content
async function renderEmailContent(
  event: string,
  userName: string,
  confirmationUrl: string,
  locale: Locale,
  inviteCode?: string
): Promise<{ subject: string; html: string; text: string } | null> {
  const t = getTranslation(event, locale);
  let html: string;

  switch (event) {
    case "EMAIL_VERIFY": {
      html = await renderAsync(
        React.createElement(EmailVerifyEmail, { userName, confirmationUrl, locale })
      );
      break;
    }
    case "MAGIC_LINK": {
      html = await renderAsync(
        React.createElement(MagicLinkEmail, { userName, confirmationUrl, locale })
      );
      break;
    }
    case "PASSWORD_RECOVERY": {
      html = await renderAsync(
        React.createElement(PasswordRecoveryEmail, { userName, confirmationUrl, locale })
      );
      break;
    }
    case "EMAIL_CHANGE": {
      html = await renderAsync(
        React.createElement(EmailChangeEmail, { userName, confirmationUrl, locale })
      );
      break;
    }
    case "PASSWORD_CHANGED": {
      html = await renderAsync(
        React.createElement(PasswordChangedEmail, { userName, locale })
      );
      break;
    }
    case "INVITE": {
      html = await renderAsync(
        React.createElement(InviteEmail, {
          userName,
          confirmationUrl,
          inviteCode: inviteCode || "",
          locale,
        })
      );
      break;
    }
    default:
      console.log(`Unknown event type: ${event}`);
      return null;
  }

  const text = generatePlainText(event, locale, userName, confirmationUrl, inviteCode);
  return { subject: t.subject, html, text };
}

// Main handler
serve(async (req) => {
  const correlationId = generateCorrelationId();
  console.log(`[${correlationId}] Request received`);

  // Method check
  if (req.method !== "POST") {
    console.log(`[${correlationId}] Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Security: Validate hook secret
  const providedSecret = req.headers.get("x-flymusic-hook-secret");
  if (!providedSecret || providedSecret !== hookSecret) {
    console.log(`[${correlationId}] Forbidden: Invalid or missing secret`);
    return new Response(
      JSON.stringify({ ok: false, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Normalize payload
  const payload = normalizePayload(body);
  if (!payload || !payload.event || !payload.email) {
    console.log(`[${correlationId}] Missing required fields`);
    return new Response(
      JSON.stringify({ ok: false, error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Hash email for logging
  const emailHash = await hashEmail(payload.email);
  console.log(`[${correlationId}] Processing ${payload.event} for hash ${emailHash.slice(0, 8)}...`);

  // Resolve locale
  const locale = await resolveLocale(supabase, payload);
  console.log(`[${correlationId}] Resolved locale: ${locale}`);

  // Rate limiting (for sensitive events, return 202 silently)
  const sensitiveEvents = ["PASSWORD_RECOVERY", "MAGIC_LINK"];
  if (sensitiveEvents.includes(payload.event)) {
    const rateLimited = await isRateLimited(supabase, emailHash, payload.event);
    if (rateLimited) {
      console.log(`[${correlationId}] Rate limited - returning 202`);
      await logEmailEvent(supabase, {
        correlationId,
        userId: payload.user_id,
        emailHash,
        event: payload.event,
        locale,
        status: "rate_limited",
      });
      // Anti-enumeration: Always return 202 for these events
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  try {
    // Render email
    const userName = payload.user_name || "there";
    const confirmationUrl = payload.confirmation_url || "";
    
    const emailContent = await renderEmailContent(
      payload.event,
      userName,
      confirmationUrl,
      locale,
      payload.invite_code
    );

    if (!emailContent) {
      console.log(`[${correlationId}] No template for event: ${payload.event}`);
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log queued event
    await logEmailEvent(supabase, {
      correlationId,
      userId: payload.user_id,
      emailHash,
      event: payload.event,
      locale,
      status: "queued",
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "FlyMusic <noreply@flymusic.se>",
      to: [payload.email],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (error) {
      console.error(`[${correlationId}] Resend error:`, error);
      await logEmailEvent(supabase, {
        correlationId,
        userId: payload.user_id,
        emailHash,
        event: payload.event,
        locale,
        status: "failed",
        errorCode: error.message,
      });
      // Don't expose error details
      return new Response(
        JSON.stringify({ ok: false }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log success
    await logEmailEvent(supabase, {
      correlationId,
      userId: payload.user_id,
      emailHash,
      event: payload.event,
      locale,
      status: "sent",
      providerMessageId: data?.id,
    });

    console.log(`[${correlationId}] Email sent successfully`);
    
    // For sensitive events, always return 202 (anti-enumeration)
    if (sensitiveEvents.includes(payload.event)) {
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(`[${correlationId}] Unexpected error:`, error);
    await logEmailEvent(supabase, {
      correlationId,
      userId: payload.user_id,
      emailHash,
      event: payload.event,
      locale,
      status: "failed",
      errorCode: "INTERNAL_ERROR",
    });
    return new Response(
      JSON.stringify({ ok: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
