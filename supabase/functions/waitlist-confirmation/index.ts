import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WaitlistUserType = "fan" | "artist";

interface WaitlistConfirmationRequest {
  email?: unknown;
  user_type?: unknown;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUserType(userType: string): userType is WaitlistUserType {
  return userType === "fan" || userType === "artist";
}

function normalizeBaseUrl(appBaseUrl: string): string {
  return appBaseUrl.trim().replace(/\/$/, "");
}

function getRoleLabel(userType: WaitlistUserType): string {
  return userType === "artist" ? "artist" : "fan";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildConfirmationEmail(userType: WaitlistUserType, appBaseUrl: string): string {
  const roleLabel = getRoleLabel(userType);
  const rolePath = userType === "artist" ? "/artist" : "/fan";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#ffffff;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;">
            <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;text-align:center;">You're on the FlyMusic beta waitlist</h1>
            <p style="color:#d4d4d8;font-size:16px;line-height:1.6;margin:0 0 18px;text-align:center;">
              Thanks for joining as a ${roleLabel}. We received your request and will email you when your beta access is ready.
            </p>
            <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;text-align:center;">
              FlyMusic is onboarding in waves so early users get a smoother experience.
            </p>
            <div style="text-align:center;margin:32px 0 0;">
              <a href="${escapeHtml(appBaseUrl)}${rolePath}" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
                Visit FlyMusic
              </a>
            </div>
          </div>
          <p style="color:#71717a;font-size:12px;line-height:1.5;text-align:center;margin:24px 0 0;">
            You received this because this email was submitted to the FlyMusic beta waitlist.
          </p>
        </div>
      </body>
    </html>
  `;
}

function buildAdminNotificationEmail(email: string, userType: WaitlistUserType, appBaseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#18181b;">
        <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:28px;">
            <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;">New FlyMusic beta waitlist signup</h1>
            <p style="font-size:15px;line-height:1.6;margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="font-size:15px;line-height:1.6;margin:0 0 8px;"><strong>User type:</strong> ${userType}</p>
            <p style="font-size:15px;line-height:1.6;margin:0;"><strong>Source:</strong> ${escapeHtml(appBaseUrl)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendEmailViaResend(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    let message = "Email provider request failed";
    try {
      const data = await response.json();
      if (typeof data?.message === "string") message = data.message;
    } catch {
      // Keep the generic safe error if the provider response is not JSON.
    }
    return { success: false, error: message };
  }

  return { success: true };
}

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[WAITLIST-CONFIRMATION][${correlationId}] ${step}`, details ? JSON.stringify(details) : "");
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed", correlation_id: correlationId }, 405);
  }

  try {
    const payload = (await req.json()) as WaitlistConfirmationRequest;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const userType = typeof payload.user_type === "string" ? payload.user_type : "";

    if (!isValidEmail(email)) {
      log("VALIDATION_ERROR", { reason: "invalid_email" });
      return jsonResponse({ error: "Invalid email", correlation_id: correlationId }, 400);
    }

    if (!isValidUserType(userType)) {
      log("VALIDATION_ERROR", { reason: "invalid_user_type" });
      return jsonResponse({ error: "Invalid user_type", correlation_id: correlationId }, 400);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM");
    const adminEmail = Deno.env.get("WAITLIST_ADMIN_EMAIL");
    const appBaseUrl = Deno.env.get("APP_BASE_URL");

    if (!resendApiKey || !emailFrom || !adminEmail || !appBaseUrl) {
      log("CONFIG_ERROR", {
        resend_api_key: resendApiKey ? "SET" : "MISSING",
        email_from: emailFrom ? "SET" : "MISSING",
        waitlist_admin_email: adminEmail ? "SET" : "MISSING",
        app_base_url: appBaseUrl ? "SET" : "MISSING",
      });
      return jsonResponse({ error: "Email service is not configured", correlation_id: correlationId }, 500);
    }

    log("REQUEST_VALIDATED", { user_type: userType, email_domain: email.split("@")[1] });

    const confirmationResult = await sendEmailViaResend({
      apiKey: resendApiKey,
      from: emailFrom,
      to: email,
      subject: "You're on the FlyMusic beta waitlist",
      html: buildConfirmationEmail(userType, normalizeBaseUrl(appBaseUrl)),
    });

    if (!confirmationResult.success) {
      log("CONFIRMATION_SEND_FAILED", { user_type: userType, reason: confirmationResult.error });
      return jsonResponse({ error: "Confirmation email could not be sent", correlation_id: correlationId }, 502);
    }

    const adminResult = await sendEmailViaResend({
      apiKey: resendApiKey,
      from: emailFrom,
      to: adminEmail,
      subject: `New FlyMusic beta waitlist signup: ${userType}`,
      html: buildAdminNotificationEmail(email, userType, normalizeBaseUrl(appBaseUrl)),
    });

    if (!adminResult.success) {
      log("ADMIN_NOTIFICATION_SEND_FAILED", { user_type: userType, reason: adminResult.error });
      return jsonResponse({ error: "Admin notification could not be sent", correlation_id: correlationId }, 502);
    }

    log("EMAILS_SENT", { user_type: userType });
    return jsonResponse({ ok: true, confirmation_sent: true, admin_notification_sent: true, correlation_id: correlationId });
  } catch (error) {
    log("UNHANDLED_ERROR", { reason: error instanceof Error ? error.message : "unknown" });
    return jsonResponse({ error: "Unexpected error", correlation_id: correlationId }, 500);
  }
});
