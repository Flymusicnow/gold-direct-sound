import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /config - App configuration endpoint
 * 
 * Returns platform-wide configuration from DB.
 * - mvp_mode with restricted grants (artist_trial, fan_supporter only)
 * - payments_enabled
 * - trial_policy
 * - subscription_products with price_ore
 * - feature_unlocks with numeric required_level
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
    // Query platform_config
    const { data: configData, error: configError } = await supabaseClient
      .from("platform_config")
      .select("key, value");

    if (configError) {
      console.error("Error fetching platform_config:", configError);
    }

    const configMap: Record<string, any> = {};
    (configData ?? []).forEach((c: { key: string; value: any }) => {
      configMap[c.key] = c.value;
    });

    // Query premium_plans for subscription products
    const { data: products, error: productsError } = await supabaseClient
      .from("premium_plans")
      .select("plan_key, plan_name, price_monthly_ore, price_yearly_ore, features, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (productsError) {
      console.error("Error fetching premium_plans:", productsError);
    }

    // Query feature_permissions with numeric required_level
    const { data: features, error: featuresError } = await supabaseClient
      .from("feature_permissions")
      .select("feature_key, required_level, user_type, mvp_available")
      .eq("is_active", true)
      .order("sort_order");

    if (featuresError) {
      console.error("Error fetching feature_permissions:", featuresError);
    }

    // Build response with canonical structure
    const config = {
      mvp_mode: configMap.mvp_mode ?? { enabled: true, grants: ["artist_trial", "fan_supporter"] },
      payments_enabled: configMap.payments_enabled === true || configMap.payments_enabled === "true",
      trial: configMap.trial_policy ?? {
        trial_enabled: true,
        allowed_lengths_days: [7, 14, 30],
        default_length_days: 14,
      },
      limits: configMap.limits ?? {},
      subscription_products: (products ?? []).map((p: any) => ({
        key: p.plan_key,
        name: p.plan_name,
        price_ore: p.price_monthly_ore,
        billing_period: "month",
        features: p.features ?? [],
        active: p.is_active,
      })),
      // CRITICAL: required_level is INTEGER (0, 10, 20, 30)
      feature_unlocks: (features ?? []).map((f: any) => ({
        feature_key: f.feature_key,
        required_level: f.required_level, // MUST be number
        user_type: f.user_type,
        mvp_available: f.mvp_available,
      })),
    };

    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("get-config error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
