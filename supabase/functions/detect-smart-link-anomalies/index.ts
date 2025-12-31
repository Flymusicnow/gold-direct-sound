import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyResult {
  type: 'ip_abuse' | 'burst_traffic' | 'bot_pattern';
  severity: 'low' | 'medium' | 'high';
  linkId?: string;
  pageId?: string;
  details: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[DETECT-SMART-LINK-ANOMALIES][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    log('STARTING');

    const anomalies: AnomalyResult[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 1. Detect IP abuse: Same IP > 50 clicks in 1 hour on any link
    const { data: ipAbuseData, error: ipError } = await supabase
      .from('smart_link_clicks')
      .select('ip_hash, external_link_id')
      .gte('created_at', oneHourAgo);

    if (ipError) {
      log('ERROR', { step: 'fetch_ip_data', error: ipError.message });
    } else if (ipAbuseData) {
      // Group by IP hash
      const ipCounts: Record<string, { count: number; links: Set<string> }> = {};
      for (const click of ipAbuseData) {
        if (!click.ip_hash) continue;
        if (!ipCounts[click.ip_hash]) {
          ipCounts[click.ip_hash] = { count: 0, links: new Set() };
        }
        ipCounts[click.ip_hash].count++;
        if (click.external_link_id) {
          ipCounts[click.ip_hash].links.add(click.external_link_id);
        }
      }

      // Flag IPs with > 50 clicks
      for (const [ipHash, data] of Object.entries(ipCounts)) {
        if (data.count > 50) {
          const linkIds = Array.from(data.links);
          for (const linkId of linkIds) {
            anomalies.push({
              type: 'ip_abuse',
              severity: data.count > 100 ? 'high' : 'medium',
              linkId,
              details: {
                ip_hash: ipHash,
                click_count: data.count,
                time_window: '1 hour',
              },
            });
          }
          log('IP_ABUSE_DETECTED', { ipHash: ipHash.substring(0, 8) + '...', clickCount: data.count });
        }
      }
    }

    // 2. Detect burst traffic: > 100 clicks on single link in 5 minutes
    const { data: burstData, error: burstError } = await supabase
      .from('smart_link_clicks')
      .select('external_link_id')
      .gte('created_at', fiveMinutesAgo);

    if (burstError) {
      log('ERROR', { step: 'fetch_burst_data', error: burstError.message });
    } else if (burstData) {
      // Group by link ID
      const linkCounts: Record<string, number> = {};
      for (const click of burstData) {
        if (!click.external_link_id) continue;
        linkCounts[click.external_link_id] = (linkCounts[click.external_link_id] || 0) + 1;
      }

      // Flag links with > 100 clicks in 5 min
      for (const [linkId, count] of Object.entries(linkCounts)) {
        if (count > 100) {
          anomalies.push({
            type: 'burst_traffic',
            severity: count > 200 ? 'high' : 'medium',
            linkId,
            details: {
              click_count: count,
              time_window: '5 minutes',
            },
          });
          log('BURST_TRAFFIC_DETECTED', { linkId: linkId.substring(0, 8) + '...', clickCount: count });
        }
      }
    }

    // 3. Detect bot patterns: Regular interval clicks from same IP
    const { data: botPatternData, error: botError } = await supabase
      .from('smart_link_clicks')
      .select('ip_hash, external_link_id, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: true });

    if (botError) {
      log('ERROR', { step: 'fetch_bot_data', error: botError.message });
    } else if (botPatternData) {
      // Group by IP and link, then check for regular intervals
      const ipLinkClicks: Record<string, Date[]> = {};
      for (const click of botPatternData) {
        if (!click.ip_hash || !click.external_link_id) continue;
        const key = `${click.ip_hash}:${click.external_link_id}`;
        if (!ipLinkClicks[key]) {
          ipLinkClicks[key] = [];
        }
        ipLinkClicks[key].push(new Date(click.created_at));
      }

      // Check for regular intervals (within 2 seconds of expected)
      for (const [key, clicks] of Object.entries(ipLinkClicks)) {
        if (clicks.length < 10) continue;

        // Calculate intervals
        const intervals: number[] = [];
        for (let i = 1; i < clicks.length; i++) {
          intervals.push(clicks[i].getTime() - clicks[i - 1].getTime());
        }

        // Check if intervals are suspiciously regular (e.g., all ~30 seconds)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // If standard deviation < 2 seconds and avg interval < 60 seconds, likely bot
        if (stdDev < 2000 && avgInterval < 60000 && avgInterval > 5000) {
          const [ipHash, linkId] = key.split(':');
          anomalies.push({
            type: 'bot_pattern',
            severity: 'high',
            linkId,
            details: {
              ip_hash: ipHash,
              click_count: clicks.length,
              avg_interval_ms: avgInterval,
              std_dev_ms: stdDev,
              pattern: 'Regular interval clicking detected',
            },
          });
          log('BOT_PATTERN_DETECTED', { key: key.substring(0, 16) + '...', avgIntervalMs: avgInterval });
        }
      }
    }

    // 4. Store detected anomalies and notify admins
    if (anomalies.length > 0) {
      log('ANOMALIES_FOUND', { count: anomalies.length });

      // Get link-to-page mapping for affected links
      const linkIds = [...new Set(anomalies.map(a => a.linkId).filter(Boolean))];
      const { data: linkData } = await supabase
        .from('smart_link_external_links')
        .select('id, smart_link_page_id')
        .in('id', linkIds);

      const linkToPage: Record<string, string> = {};
      for (const link of linkData || []) {
        linkToPage[link.id] = link.smart_link_page_id;
      }

      // Insert anomaly alerts
      for (const anomaly of anomalies) {
        const pageId = anomaly.linkId ? linkToPage[anomaly.linkId] : anomaly.pageId;
        
        // Check if similar alert already exists (avoid duplicates)
        const { data: existingAlert } = await supabase
          .from('smart_link_anomaly_alerts')
          .select('id')
          .eq('external_link_id', anomaly.linkId || '')
          .eq('alert_type', anomaly.type)
          .eq('resolved', false)
          .maybeSingle();

        if (!existingAlert) {
          await supabase.from('smart_link_anomaly_alerts').insert({
            smart_link_page_id: pageId,
            external_link_id: anomaly.linkId,
            alert_type: anomaly.type,
            severity: anomaly.severity,
            details: anomaly.details,
          });

          // Notify admins
          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['admin', 'super_admin']);

          for (const admin of admins || []) {
            await supabase.from('notifications').insert({
              user_id: admin.user_id,
              type: 'admin_alert',
              title: `🚨 Smart Link Anomaly: ${anomaly.type}`,
              message: `${anomaly.severity.toUpperCase()} severity ${anomaly.type} detected. Check admin panel for details.`,
              link: '/admin/smart-links',
              metadata: anomaly.details,
            });
          }
        }
      }

      // Flag suspicious links for review
      for (const anomaly of anomalies) {
        if (anomaly.linkId && anomaly.severity === 'high') {
          await supabase
            .from('smart_link_external_links')
            .update({
              status: 'flagged',
              flag_reason: `Auto-flagged: ${anomaly.type} detected`,
            })
            .eq('id', anomaly.linkId)
            .eq('status', 'active'); // Only flag if currently active
        }
      }
    }

    log('COMPLETE', { 
      anomaliesDetected: anomalies.length,
      execution_time_ms: Date.now() - startTime
    });

    // Persist log
    await supabase.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'detect-smart-link-anomalies',
      step: 'COMPLETE',
      level: anomalies.length > 0 ? 'warn' : 'info',
      message: `Detected ${anomalies.length} anomalies`,
      details: { anomalies_detected: anomalies.length },
      execution_time_ms: Date.now() - startTime,
      status_code: 200
    });

    const response = {
      success: true,
      anomalies_detected: anomalies.length,
      scan_time: new Date().toISOString(),
      details: anomalies,
      correlation_id: correlationId,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('UNHANDLED_ERROR', { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, correlation_id: correlationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
