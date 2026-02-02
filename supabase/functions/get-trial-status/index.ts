import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /trial/status - Trial status endpoint
 * 
 * Returns server-calculated trial state for current user.
 * Currently returns static JSON; will query user_trials table.
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Unauthenticated: return default state
      return new Response(JSON.stringify({
        trial_enabled: true,
        trial_length_days: null,
        trial_started_at: null,
        trial_ends_at: null,
        trial_days_left: null,
        trial_state: "none",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({
        trial_enabled: true,
        trial_length_days: null,
        trial_started_at: null,
        trial_ends_at: null,
        trial_days_left: null,
        trial_state: "none",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // STUB: Static trial status for MVP
    // TODO: Query user_trials table and calculate server-side
    const now = new Date();
    const trialStarted = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const trialEnds = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000);
    
    const trialStatus = {
      trial_enabled: true,
      trial_length_days: 14,
      trial_started_at: trialStarted.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      trial_days_left: 11, // Server-calculated
      trial_state: "active" as const,
    };

    return new Response(JSON.stringify(trialStatus), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
