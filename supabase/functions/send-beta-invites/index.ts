import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: "fan" | "artist";
  waitlistId?: string;
}

interface InvitePayload {
  invites: InviteRequest[];
}

// Generate a unique invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "FLY-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate email HTML for fan invite
function generateFanEmailHtml(code: string, inviteLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="https://flymusic.se/flymusic-logo.png" alt="FlyMusic" style="height: 40px;" />
        </div>
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">
            🎵 You're In!
          </h1>
          <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
            Your exclusive invite to FlyMusic's private beta is here. Join a community of music lovers discovering amazing independent artists.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invite
            </a>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="color: #888888; font-size: 14px; margin: 0 0 8px 0; text-align: center;">
              Or enter this code manually on flymusic.se/fan:
            </p>
            <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; text-align: center; letter-spacing: 2px;">
              ${code}
            </p>
          </div>
        </div>
        <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 24px;">
          This is a personal invite. Please don't share your code.
        </p>
      </div>
    </body>
    </html>
  `;
}

// Generate email HTML for artist invite
function generateArtistEmailHtml(code: string, inviteLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="https://flymusic.se/flymusic-logo.png" alt="FlyMusic" style="height: 40px;" />
        </div>
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">
            🎤 Welcome, Artist!
          </h1>
          <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
            You've been invited to join FlyMusic's private beta as an artist. Build your fanbase, share your music, and connect with supporters who believe in your art.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Join as Artist
            </a>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="color: #888888; font-size: 14px; margin: 0 0 8px 0; text-align: center;">
              Or use this code during signup:
            </p>
            <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; text-align: center; letter-spacing: 2px;">
              ${code}
            </p>
          </div>
        </div>
        <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 24px;">
          This is a personal invite for artist access. Please don't share your code.
        </p>
      </div>
    </body>
    </html>
  `;
}

// Small delay helper for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Send email via Resend API
async function sendEmailViaResend(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") || "FlyMusic <info@flymusic.se>",
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.message || "Email send failed" };
  }

  return { success: true };
}

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[SEND-BETA-INVITES][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('REQUEST_RECEIVED');
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log('AUTH_ERROR', { reason: 'no_header' });
      return new Response(JSON.stringify({ error: "Unauthorized", correlation_id: correlationId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user and check admin status
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      log('AUTH_ERROR', { reason: 'user_verification_failed', error: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized", correlation_id: correlationId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has admin role using multi-role safe query (user may have multiple roles)
    const { data: adminRoles, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);

    if (roleError) {
      log('AUTH_ERROR', { reason: 'role_check_failed', error: roleError.message });
      return new Response(JSON.stringify({ error: "Authorization check failed", correlation_id: correlationId }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdmin = (adminRoles?.length ?? 0) > 0;
    if (!isAdmin) {
      log('AUTH_ERROR', { reason: 'not_admin', userId: user.id });
      return new Response(JSON.stringify({ error: "Admin access required", correlation_id: correlationId }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log('ADMIN_VERIFIED', { userId: user.id });

    // Parse request body
    const payload: InvitePayload = await req.json();
    const { invites } = payload;

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      log('VALIDATION_ERROR', { reason: 'no_invites' });
      return new Response(JSON.stringify({ error: "No invites provided", correlation_id: correlationId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit batch size
    if (invites.length > 25) {
      log('VALIDATION_ERROR', { reason: 'batch_too_large', count: invites.length });
      return new Response(JSON.stringify({ error: "Maximum 25 invites per request", correlation_id: correlationId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      log('CONFIG_ERROR', { reason: 'missing_resend_key' });
      return new Response(JSON.stringify({ error: "Email service not configured", correlation_id: correlationId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = "https://flymusic.se";
    const sent: Array<{ email: string; role: string }> = [];
    const failed: Array<{ email: string; error: string }> = [];
    const skipped: Array<{ email: string; reason: string }> = [];

    log('PROCESSING_INVITES', { count: invites.length, adminId: user.id });

    for (const invite of invites) {
      const { email, role, waitlistId } = invite;

      // Validate email
      if (!isValidEmail(email)) {
        failed.push({ email, error: "Invalid email format" });
        continue;
      }

      // Validate role
      if (role !== "fan" && role !== "artist") {
        failed.push({ email, error: "Invalid role" });
        continue;
      }

      try {
        // Check for existing active invite (not redeemed or replaced)
        const { data: existingInvite } = await supabaseClient
          .from("beta_invites")
          .select("id, status, code")
          .eq("email", email)
          .eq("role", role)
          .is("replaced_by", null)
          .not("status", "in", '("redeemed","replaced")')
          .maybeSingle();

        let rotatingCode = false;
        let oldInviteId: string | null = null;

        if (existingInvite) {
          if (existingInvite.status === "sent") {
            // Mark old invite as replaced (code rotation)
            await supabaseClient
              .from("beta_invites")
              .update({ 
                status: "replaced",
                replaced_at: new Date().toISOString()
              })
              .eq("id", existingInvite.id);
            
            rotatingCode = true;
            oldInviteId = existingInvite.id;
            log('INVITE_ROTATING', { email, old_code: existingInvite.code.substring(0, 4) + '...' });
          } else {
            skipped.push({ email, reason: "Already has pending invite" });
            continue;
          }
        }

        // Check waitlist status if waitlistId provided
        if (waitlistId) {
          const { data: waitlistEntry } = await supabaseClient
            .from("beta_waitlist")
            .select("status")
            .eq("id", waitlistId)
            .single();

          if (waitlistEntry?.status === "invited") {
            skipped.push({ email, reason: "Already invited via waitlist" });
            continue;
          }
        }

        // Generate unique code
        let code: string;
        let attempts = 0;
        do {
          code = generateInviteCode();
          const { data: codeExists } = await supabaseClient
            .from("beta_invites")
            .select("id")
            .eq("code", code)
            .maybeSingle();
          if (!codeExists) break;
          attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
          failed.push({ email, error: "Could not generate unique code" });
          continue;
        }

        // Create beta_invites record
        const { data: inviteRecord, error: insertError } = await supabaseClient
          .from("beta_invites")
          .insert({
            email,
            role,
            code,
            status: "created",
            created_by: user.id,
            waitlist_id: waitlistId || null,
          })
          .select()
          .single();

        if (insertError) {
          log('DB_ERROR', { email, error: insertError.message });
          failed.push({ email, error: "Database error" });
          continue;
        }

        // Build invite link with role and code params
        const inviteLink = `${baseUrl}/early-access?role=${role}&code=${code}`;

        // Send email
        const subject = role === "artist" 
          ? "Welcome to FlyMusic Private Beta (Artist Access) 🎤"
          : "Your FlyMusic Beta Invite 🎵";

        const html = role === "artist"
          ? generateArtistEmailHtml(code, inviteLink)
          : generateFanEmailHtml(code, inviteLink);

        const emailResult = await sendEmailViaResend(resendApiKey, email, subject, html);

        if (!emailResult.success) {
          log('EMAIL_ERROR', { email, error: emailResult.error });
          
          // Update invite status to failed
          await supabaseClient
            .from("beta_invites")
            .update({
              status: "failed",
              last_error: emailResult.error,
            })
            .eq("id", inviteRecord.id);

          failed.push({ email, error: emailResult.error || "Email send failed" });
          continue;
        }

        log('EMAIL_SENT', { email, role, code: code.substring(0, 4) + '...' });

        // Update beta_invites to sent
        const { data: newInvite } = await supabaseClient
          .from("beta_invites")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", inviteRecord.id)
          .select()
          .single();

        // If rotating, link the old invite to the new one
        if (rotatingCode && oldInviteId && newInvite) {
          await supabaseClient
            .from("beta_invites")
            .update({ replaced_by: newInvite.id })
            .eq("id", oldInviteId);
          
          log('INVITE_ROTATED', { email, new_code: code.substring(0, 4) + '...' });
        }

        // Update waitlist entry if exists
        if (waitlistId) {
          await supabaseClient
            .from("beta_waitlist")
            .update({
              status: "invited",
              invited_at: new Date().toISOString(),
              invited_by: user.id,
            })
            .eq("id", waitlistId);
        } else {
          // Try to find and update waitlist by email
          await supabaseClient
            .from("beta_waitlist")
            .update({
              status: "invited",
              invited_at: new Date().toISOString(),
              invited_by: user.id,
            })
            .eq("email", email);
        }

        sent.push({ email, role });

        // Rate limiting delay
        await delay(200);

      } catch (error) {
        log('INVITE_ERROR', { email, error: error instanceof Error ? error.message : String(error) });
        
        // Try to update invite record with error
        await supabaseClient
          .from("beta_invites")
          .update({
            status: "failed",
            last_error: error instanceof Error ? error.message : String(error),
          })
          .eq("email", email)
          .eq("status", "created");

        failed.push({ email, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    log('COMPLETE', { 
      sent: sent.length, 
      failed: failed.length, 
      skipped: skipped.length,
      execution_time_ms: Date.now() - startTime
    });

    // Persist summary log
    await supabaseClient.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'send-beta-invites',
      step: 'COMPLETE',
      level: failed.length > 0 ? 'warn' : 'info',
      message: `Sent ${sent.length}, failed ${failed.length}, skipped ${skipped.length}`,
      details: { sent: sent.length, failed: failed.length, skipped: skipped.length },
      execution_time_ms: Date.now() - startTime,
      status_code: 200,
      user_id: user.id
    });

    return new Response(
      JSON.stringify({ sent, failed, skipped, correlation_id: correlationId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    log('UNHANDLED_ERROR', { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error", correlation_id: correlationId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
