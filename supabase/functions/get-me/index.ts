import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /me - Current user endpoint
 * 
 * Returns user profile with:
 * - role, effective_level
 * - permissions (boolean map from resolve_user_permissions RPC)
 * - trial object with type, level_scope, days_left
 * - mvp_mode config
 * 
 * Frontend uses ONLY permissions[feature_key] for access checks.
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

    // Fetch profile for basic info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    // Fetch roles from user_roles table
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const roles = rolesData?.map(r => r.role) ?? [];

    // Call resolve_user_permissions RPC - this is the single source of truth
    const { data: permData, error: permError } = await supabaseClient
      .rpc('resolve_user_permissions', { _user_id: user.id });

    if (permError) {
      console.error("Error calling resolve_user_permissions:", permError);
    }

    // Build canonical response
    const response = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      role: permData?.role ?? profile?.role ?? 'fan',
      roles,
      // Backend-resolved permissions - frontend uses ONLY this
      permissions: permData?.permissions ?? {},
      // Numeric effective level for display purposes only
      effective_level: permData?.effective_level ?? 0,
      // Scope-aware trial object
      trial: permData?.trial ?? {
        active: false,
        type: null,
        level_scope: null,
        started_at: null,
        ends_at: null,
        days_left: null,
        state: 'none'
      },
      // MVP mode config
      mvp_mode: permData?.mvp_mode ?? { enabled: true, grants: ['artist_trial', 'fan_supporter'] },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("get-me error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
