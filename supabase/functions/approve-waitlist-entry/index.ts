import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WaitlistUserType = "fan" | "artist" | "both";
type InviteRole = "fan" | "artist";

interface ApproveWaitlistRequest {
  waitlist_id?: unknown;
}

interface WaitlistEntry {
  id: string;
  email: string;
  user_type: WaitlistUserType;
  status: string;
}

interface BetaInvite {
  id: string;
  code: string;
  status: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeBaseUrl(appBaseUrl: string): string {
  return appBaseUrl.trim().replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomValues = new Uint8Array(6);
  crypto.getRandomValues(randomValues);
  return `FLY-${Array.from(randomValues, (value) => chars[value % chars.length]).join("")}`;
}

function getInviteRole(userType: WaitlistUserType): InviteRole {
  return userType === "artist" ? "artist" : "fan";
}

function buildInviteEmail(role: InviteRole, code: string, appBaseUrl: string): string {
  const path = role === "artist" ? "/artist" : "/fan";
  const roleLabel = role === "artist" ? "artist" : "fan";
  const heading = role === "artist" ? "Your FlyMusic artist beta invite is ready" : "Your FlyMusic beta invite is ready";
  const inviteLink = `${normalizeBaseUrl(appBaseUrl)}/early-access?role=${role}&code=${encodeURIComponent(code)}`;

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
            <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;text-align:center;">${heading}</h1>
            <p style="color:#d4d4d8;font-size:16px;line-height:1.6;margin:0 0 24px;text-align:center;">
              Your private beta access as a ${roleLabel} has been approved. Use the secure invite link below, or enter the invite code manually on FlyMusic.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${escapeHtml(inviteLink)}" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
                Accept invite
              </a>
            </div>
            <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:16px;margin-top:24px;">
              <p style="color:#a1a1aa;font-size:14px;margin:0 0 8px;text-align:center;">Manual invite code:</p>
              <p style="color:#ffffff;font-size:24px;font-weight:700;margin:0;text-align:center;letter-spacing:2px;">${escapeHtml(code)}</p>
            </div>
            <p style="color:#a1a1aa;font-size:13px;line-height:1.5;margin:24px 0 0;text-align:center;">If the button does not work, visit ${escapeHtml(normalizeBaseUrl(appBaseUrl) + path)} and enter the code manually.</p>
          </div>
          <p style="color:#71717a;font-size:12px;line-height:1.5;text-align:center;margin:24px 0 0;">This is a personal invite. Please do not share your code.</p>
        </div>
      </body>
    </html>
  `;
}

async function sendEmailViaResend(params: { apiKey: string; from: string; to: string; subject: string; html: string }): Promise<{ success: boolean; error?: string }> {
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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, error: typeof data?.message === "string" ? data.message : "Email send failed" };
  }
  return { success: true };
}

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[APPROVE-WAITLIST][${correlationId}] ${step}`, details ? JSON.stringify(details) : "");
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed", correlation_id: correlationId }, 405);
  }

  try {
    log("REQUEST_RECEIVED");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log("AUTH_ERROR", { reason: "missing_bearer" });
      return jsonResponse({ error: "Unauthorized", correlation_id: correlationId }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM");
    const appBaseUrl = Deno.env.get("APP_BASE_URL");

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey || !emailFrom || !appBaseUrl) {
      log("CONFIG_ERROR", {
        supabase_url: supabaseUrl ? "SET" : "MISSING",
        supabase_service_role_key: supabaseServiceKey ? "SET" : "MISSING",
        resend_api_key: resendApiKey ? "SET" : "MISSING",
        email_from: emailFrom ? "SET" : "MISSING",
        app_base_url: appBaseUrl ? "SET" : "MISSING",
      });
      return jsonResponse({ error: "Server configuration is incomplete", correlation_id: correlationId }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData.user;

    if (userError || !user) {
      log("AUTH_ERROR", { reason: "user_verification_failed", error: userError?.message });
      return jsonResponse({ error: "Unauthorized", correlation_id: correlationId }, 401);
    }

    const { data: adminRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);

    if (roleError) {
      log("AUTH_ERROR", { reason: "role_check_failed", error: roleError.message, user_id: user.id });
      return jsonResponse({ error: "Authorization check failed", correlation_id: correlationId }, 403);
    }

    if ((adminRoles?.length ?? 0) === 0) {
      log("AUTH_ERROR", { reason: "not_admin", user_id: user.id });
      return jsonResponse({ error: "Admin access required", correlation_id: correlationId }, 403);
    }

    const payload = (await req.json().catch(() => ({}))) as ApproveWaitlistRequest;
    if (!isUuid(payload.waitlist_id)) {
      log("VALIDATION_ERROR", { reason: "invalid_waitlist_id" });
      return jsonResponse({ error: "Valid waitlist_id is required", correlation_id: correlationId }, 400);
    }

    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from("beta_waitlist")
      .select("id,email,user_type,status")
      .eq("id", payload.waitlist_id)
      .maybeSingle();

    if (waitlistError) {
      log("DB_ERROR", { step: "fetch_waitlist", error: waitlistError.message });
      return jsonResponse({ error: "Could not fetch waitlist entry", correlation_id: correlationId }, 500);
    }

    const entry = waitlistEntry as WaitlistEntry | null;

    if (!entry) {
      return jsonResponse({ error: "Waitlist entry not found", correlation_id: correlationId }, 404);
    }

    if (!isValidEmail(entry.email) || !["pending", "approved"].includes(entry.status)) {
      log("VALIDATION_ERROR", { reason: "entry_not_eligible", waitlist_id: entry.id, status: entry.status });
      return jsonResponse({ error: "Waitlist entry is not eligible for approval", correlation_id: correlationId }, 409);
    }

    const role = getInviteRole(entry.user_type);
    const now = new Date().toISOString();

    const { data: existingInvite } = await supabase
      .from("beta_invites")
      .select("id,code,status")
      .eq("waitlist_id", entry.id)
      .in("status", ["created", "sent"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let invite = (existingInvite as BetaInvite | null) ?? null;

    if (!invite) {
      let code = generateInviteCode();
      for (let attempts = 0; attempts < 10; attempts += 1) {
        const { data: codeExists } = await supabase.from("beta_invites").select("id").eq("code", code).maybeSingle();
        if (!codeExists) break;
        code = generateInviteCode();
      }

      const { data: insertedInvite, error: inviteInsertError } = await supabase
        .from("beta_invites")
        .insert({
          email: entry.email,
          role,
          code,
          status: "created",
          created_by: user.id,
          waitlist_id: entry.id,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        })
        .select("id,code,status")
        .single();

      if (inviteInsertError || !insertedInvite) {
        log("DB_ERROR", { step: "create_invite", error: inviteInsertError?.message });
        return jsonResponse({ error: "Could not create invite", correlation_id: correlationId }, 500);
      }

      invite = insertedInvite as BetaInvite;
    }

    const emailResult = await sendEmailViaResend({
      apiKey: resendApiKey,
      from: emailFrom,
      to: entry.email,
      subject: role === "artist" ? "Your FlyMusic artist beta invite is ready" : "Your FlyMusic beta invite is ready",
      html: buildInviteEmail(role, invite.code, appBaseUrl),
    });

    if (!emailResult.success) {
      log("EMAIL_ERROR", { waitlist_id: entry.id, invite_id: invite.id, reason: emailResult.error });
      await supabase.from("beta_invites").update({ status: "failed", last_error: emailResult.error ?? "Email send failed" }).eq("id", invite.id);
      return jsonResponse({ error: "Invite email could not be sent", correlation_id: correlationId }, 502);
    }

    const { error: inviteUpdateError } = await supabase
      .from("beta_invites")
      .update({ status: "sent", sent_at: now, last_error: null })
      .eq("id", invite.id);

    const { error: waitlistUpdateError } = await supabase
      .from("beta_waitlist")
      .update({ status: "invited", invited_at: now, invited_by: user.id, approved_at: now, approved_by: user.id, invite_id: invite.id })
      .eq("id", entry.id);

    if (inviteUpdateError || waitlistUpdateError) {
      log("DB_ERROR", { step: "finalize", invite_error: inviteUpdateError?.message, waitlist_error: waitlistUpdateError?.message });
      return jsonResponse({ error: "Invite was sent but status update failed", correlation_id: correlationId }, 500);
    }

    await supabase.from("admin_activity_logs").insert({
      admin_id: user.id,
      action: "waitlist.approved_and_invited",
      target_type: "beta_waitlist",
      target_id: entry.id,
      details: { invite_id: invite.id, role, correlation_id: correlationId },
    });

    await supabase.from("edge_function_logs").insert({
      correlation_id: correlationId,
      function_name: "approve-waitlist-entry",
      step: "COMPLETE",
      level: "info",
      message: "Waitlist entry approved and invite email sent",
      details: { waitlist_id: entry.id, invite_id: invite.id, role },
      execution_time_ms: Date.now() - startTime,
      status_code: 200,
      user_id: user.id,
    });

    log("COMPLETE", { waitlist_id: entry.id, invite_id: invite.id, role, execution_time_ms: Date.now() - startTime });

    return jsonResponse({ ok: true, waitlist_id: entry.id, invite_id: invite.id, status: "invited", role, correlation_id: correlationId });
  } catch (error) {
    log("UNHANDLED_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: "Internal server error", correlation_id: correlationId }, 500);
  }
});
