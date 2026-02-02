import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /config - App configuration endpoint
 * 
 * Returns platform-wide configuration.
 * Currently returns static JSON; will be wired to DB/RPC.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // STUB: Static config - will be replaced with DB queries
  const config = {
    mvp_mode: true,
    payments_enabled: false,
    trial: {
      trial_enabled: true,
      allowed_lengths_days: [7, 14, 30],
      default_length_days: 14,
    },
    limits: {
      // No hard numbers - null means unlimited or config-driven
      free_track_uploads: null,
      trial_track_uploads: null,
      pro_track_uploads: null,
    },
    subscription_products: [
      {
        key: "artist_pro",
        name: "Artist Pro",
        price_ore: 9900,
        billing_period: "month",
        features: ["Advanced analytics", "Fan segmentation", "Campaign builder"],
        active: false,
      },
      {
        key: "artist_elite",
        name: "Artist Elite",
        price_ore: 24900,
        billing_period: "month",
        features: ["Everything in Pro", "Priority support", "Custom branding"],
        active: false,
      },
      {
        key: "fan_supporter",
        name: "Fan Supporter",
        price_ore: 5900,
        billing_period: "month",
        features: ["Additional votes", "Highlight votes"],
        active: false,
      },
    ],
    feature_unlocks: [
      // Artist features
      { feature_key: "basic_profile", required_level: "artist_free", mvp_available: true },
      { feature_key: "limited_uploads", required_level: "artist_free", mvp_available: true },
      { feature_key: "full_analytics", required_level: "artist_trial", mvp_available: true },
      { feature_key: "community_tools", required_level: "artist_trial", mvp_available: true },
      { feature_key: "advanced_analytics", required_level: "artist_pro", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
      { feature_key: "fan_segmentation", required_level: "artist_pro", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
      // Fan features
      { feature_key: "follow_artists", required_level: "fan_free", mvp_available: true },
      { feature_key: "basic_vote", required_level: "fan_free", mvp_available: true },
      { feature_key: "highlight_votes", required_level: "fan_supporter", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
      { feature_key: "vip_vote", required_level: "fan_superfan", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
    ],
  };

  return new Response(JSON.stringify(config), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
