import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /trial/status - Trial status endpoint
 * 
 * Returns scope-aware trial status from get_trial_status RPC:
 * - trial_enabled: boolean
 * - trial.active: boolean
 * - trial.type: string (e.g., 'platform', 'artist_trial')
 * - trial.level_scope: number (10, 20, 30)
 * - trial.days_left: number (server-calculated)
 * - trial.state: 'active' | 'expired' | 'converted' | 'none'
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Default response for unauthenticated users
  const defaultResponse = {
    trial_enabled: true,
    trial: {
      active: false,
      type: null,
      level_scope: null,
      started_at: null,
      ends_at: null,
      days_left: null,
      state: 'none'
    }
  };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify(defaultResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify(defaultResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Call get_trial_status RPC - single source of truth
    const { data: trialData, error: trialError } = await supabaseClient
      .rpc('get_trial_status', { _user_id: userData.user.id });

    if (trialError) {
      console.error("Error calling get_trial_status:", trialError);
      return new Response(JSON.stringify(defaultResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify(trialData ?? defaultResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("get-trial-status error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
