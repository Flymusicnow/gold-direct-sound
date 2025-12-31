import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DBCheckResult {
  table: string;
  passed: boolean;
  count: number | null;
  responseTime: number;
  reason: string;
}

interface ActivityLogCheck {
  passed: boolean;
  reason: string;
  totalEvents: number;
}

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[SEND-QA-REPORT][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  log('STARTING');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .or("role.eq.admin,role.eq.super_admin");

    const adminUserIds = adminRoles?.map((r) => r.user_id) || [];

    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("email")
      .in("id", adminUserIds);

    const adminEmails = adminProfiles
      ?.map((p) => p.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      log('ERROR', { reason: 'no_admin_emails' });
      return new Response(
        JSON.stringify({ error: "No admin emails found", correlation_id: correlationId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log('ADMINS_FOUND', { count: adminEmails.length });

    // 2. Run database health checks
    const dbTables = [
      "profiles",
      "user_roles",
      "tracks",
      "artist_profiles",
      "follows",
      "admin_activity_logs",
      "runtime_errors",
    ];

    const dbChecks: DBCheckResult[] = [];
    for (const table of dbTables) {
      const start = Date.now();
      try {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        dbChecks.push({
          table,
          passed: !error,
          count: count ?? 0,
          responseTime: Date.now() - start,
          reason: error ? error.message : "OK",
        });
      } catch (err) {
        dbChecks.push({
          table,
          passed: false,
          count: null,
          responseTime: Date.now() - start,
          reason: String(err),
        });
      }
    }

    // 3. Check activity log for real events
    let activityCheck: ActivityLogCheck = {
      passed: false,
      reason: "Unknown",
      totalEvents: 0,
    };

    try {
      const { data, count } = await supabase
        .from("admin_activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1);

      if (!data || data.length === 0) {
        activityCheck = {
          passed: false,
          reason: "No activity events found",
          totalEvents: count ?? 0,
        };
      } else {
        const lastEvent = new Date(data[0].created_at);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        if (lastEvent < sevenDaysAgo) {
          activityCheck = {
            passed: false,
            reason: "No recent activity (>7 days old)",
            totalEvents: count ?? 0,
          };
        } else {
          activityCheck = {
            passed: true,
            reason: "Real events detected",
            totalEvents: count ?? 0,
          };
        }
      }
    } catch (err) {
      activityCheck = {
        passed: false,
        reason: String(err),
        totalEvents: 0,
      };
    }

    // 4. Count errors in last 24h
    let errorsLast24h = 0;
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("runtime_errors")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo);
      errorsLast24h = count ?? 0;
    } catch {
      errorsLast24h = -1;
    }

    // 5. Calculate overall status
    const dbPassed = dbChecks.filter((d) => d.passed).length;
    const dbTotal = dbChecks.length;
    const overallPassed = dbPassed === dbTotal && activityCheck.passed;

    log('CHECKS_COMPLETE', { dbPassed, dbTotal, activityPassed: activityCheck.passed, errorsLast24h });

    // 6. Generate HTML email
    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

    const dbRowsHtml = dbChecks
      .map(
        (check) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #333; font-family: monospace;">${check.table}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right;">${check.passed ? check.count?.toLocaleString() : "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right;">${check.responseTime}ms</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${check.passed ? "✅" : "❌"}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 20px; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 24px; border-bottom: 2px solid hsl(45, 82%, 51%);">
      <h1 style="margin: 0; color: hsl(45, 82%, 51%); font-size: 24px;">🧪 FlyMusic QA Report</h1>
      <p style="margin: 8px 0 0; color: #888; font-size: 14px;">${timestamp}</p>
    </div>

    <!-- Status -->
    <div style="padding: 24px; text-align: center; border-bottom: 1px solid #333;">
      <div style="font-size: 48px; margin-bottom: 8px;">${overallPassed ? "✅" : "❌"}</div>
      <h2 style="margin: 0; color: ${overallPassed ? "#22c55e" : "#ef4444"}; font-size: 20px;">
        ${overallPassed ? "ALL SYSTEMS OPERATIONAL" : "ISSUES DETECTED"}
      </h2>
    </div>

    <!-- Summary Stats -->
    <div style="display: flex; padding: 16px; border-bottom: 1px solid #333;">
      <div style="flex: 1; text-align: center; padding: 8px;">
        <div style="color: #888; font-size: 12px; text-transform: uppercase;">Database</div>
        <div style="color: #fff; font-size: 20px; font-weight: bold;">${dbPassed}/${dbTotal}</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 8px; border-left: 1px solid #333;">
        <div style="color: #888; font-size: 12px; text-transform: uppercase;">Errors (24h)</div>
        <div style="color: ${errorsLast24h > 0 ? "#ef4444" : "#22c55e"}; font-size: 20px; font-weight: bold;">${errorsLast24h}</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 8px; border-left: 1px solid #333;">
        <div style="color: #888; font-size: 12px; text-transform: uppercase;">Activity Log</div>
        <div style="color: ${activityCheck.passed ? "#22c55e" : "#ef4444"}; font-size: 20px; font-weight: bold;">${activityCheck.passed ? "REAL ✓" : "FAIL"}</div>
      </div>
    </div>

    <!-- Database Table -->
    <div style="padding: 24px;">
      <h3 style="margin: 0 0 16px; color: #fff; font-size: 16px;">🗄️ Database Health</h3>
      <table style="width: 100%; border-collapse: collapse; color: #ccc; font-size: 14px;">
        <thead>
          <tr style="color: #888; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #333;">Table</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #333;">Rows</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #333;">Time</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #333;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${dbRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background: #111; text-align: center;">
      <a href="https://flymusic.se/admin/qa" style="color: hsl(45, 82%, 51%); text-decoration: none; font-size: 14px;">
        View Full Report →
      </a>
    </div>
  </div>
</body>
</html>
    `;

    // 7. Send email via Resend
    if (!RESEND_API_KEY) {
      log('CONFIG_ERROR', { reason: 'missing_resend_key' });
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured", correlation_id: correlationId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FlyMusic QA <noreply@flymusic.se>",
        to: adminEmails,
        subject: `${overallPassed ? "✅" : "❌"} FlyMusic QA Report - ${now.toLocaleDateString()}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      let errorDetails: Record<string, unknown> = { raw: errorText };
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        // Keep raw text if not JSON
      }
      
      log('EMAIL_ERROR', { status: emailResponse.status, body: errorDetails });
      
      return new Response(
        JSON.stringify({
          ok: false,
          error: (errorDetails as { message?: string; name?: string }).message || 
                 (errorDetails as { message?: string; name?: string }).name || 
                 `Resend API error (${emailResponse.status})`,
          details: errorDetails,
          statusCode: emailResponse.status,
          correlation_id: correlationId
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log('EMAIL_SENT', { recipients: adminEmails.length });

    // 8. Log the report run
    await supabase.from("qa_report_runs").insert({
      run_type: "manual",
      overall_passed: overallPassed,
      route_checks_passed: 0,
      route_checks_total: 0,
      db_checks_passed: dbPassed,
      db_checks_total: dbTotal,
      errors_24h: errorsLast24h,
      report_sent_to: adminEmails,
    });

    log('COMPLETE', { overallPassed, execution_time_ms: Date.now() - startTime });

    // Persist log
    await supabase.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'send-qa-report',
      step: 'COMPLETE',
      level: overallPassed ? 'info' : 'warn',
      message: `QA report sent to ${adminEmails.length} admins`,
      details: { overallPassed, dbPassed, dbTotal, errorsLast24h },
      execution_time_ms: Date.now() - startTime,
      status_code: 200
    });

    return new Response(
      JSON.stringify({
        ok: true,
        success: true,
        overallPassed,
        sentTo: adminEmails,
        dbChecks: `${dbPassed}/${dbTotal}`,
        errors24h: errorsLast24h,
        correlation_id: correlationId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('UNHANDLED_ERROR', { error: errorMessage });
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: errorMessage,
        correlation_id: correlationId
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
