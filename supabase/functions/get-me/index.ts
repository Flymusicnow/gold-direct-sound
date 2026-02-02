import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /me - Current user endpoint
 * 
 * Returns user profile with resolved per-feature permissions.
 * Permissions are boolean - UI renders based on these, no level comparisons.
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    // Fetch profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch roles
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const roles = rolesData?.map(r => r.role) ?? [];

    // STUB: Resolved permissions - MVP gives trial access to all features
    // TODO: Calculate based on subscription status, trial state, role
    const permissions: Record<string, boolean> = {
      // Artist features
      basic_profile: true,
      limited_uploads: true,
      full_analytics: true,      // MVP: trial access
      community_tools: true,     // MVP: trial access
      campaign_insights: true,   // MVP: trial access
      extended_uploads: true,    // MVP: trial access
      advanced_analytics: true,  // MVP: trial access
      fan_segmentation: true,    // MVP: trial access
      campaign_builder: true,    // MVP: trial access
      // Fan features
      follow_artists: true,
      basic_vote: true,
      leaderboard: true,
      highlight_votes: true,     // MVP: trial access
      extra_votes: true,         // MVP: trial access
      vip_vote: true,            // MVP: trial access
      collectibles: true,        // MVP: trial access
    };

    // STUB: Labels for features (optional, for UI display)
    const labels: Record<string, string> = {
      advanced_analytics: "Included in trial (MVP)",
      fan_segmentation: "Included in trial (MVP)",
      campaign_builder: "Included in trial (MVP)",
      highlight_votes: "Included in trial (MVP)",
      vip_vote: "Included in trial (MVP)",
    };

    const response = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? 'fan',
      roles,
      permissions,
      labels,
    };

    return new Response(JSON.stringify(response), {
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
