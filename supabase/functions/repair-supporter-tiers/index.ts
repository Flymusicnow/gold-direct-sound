import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REPAIR-SUPPORTER-TIERS] ${step}${detailsStr}`);
};

interface TierRepairResult {
  tier_id: string;
  tier_name: string;
  artist_name: string;
  status: "ok" | "repaired" | "created" | "error";
  message: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");
    
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Admin check (user can have multiple roles)
    const { data: adminRoles, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);

    if (roleError) {
      console.error("Role check failed", { userId, error: roleError });
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = (adminRoles?.length ?? 0) > 0;

    if (!isAdmin) {
      console.warn("Non-admin access attempt", { userId });
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logStep("Admin access verified");

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { tier_id, mode = "scan" } = body; // mode: "scan" | "repair" | "repair_single"

    logStep("Request parsed", { mode, tier_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Fetch tiers - either single or all with missing stripe_price_id
    let query = supabaseClient
      .from("supporter_tiers")
      .select(`
        id,
        name,
        slug,
        price_cents,
        currency,
        description,
        features,
        stripe_product_id,
        stripe_price_id,
        artist_id,
        artist_profiles!inner(artist_name)
      `);

    if (tier_id) {
      query = query.eq("id", tier_id);
    } else if (mode === "repair") {
      query = query.is("stripe_price_id", null);
    }

    const { data: tiers, error: tiersError } = await query;

    if (tiersError) throw new Error(`Failed to fetch tiers: ${tiersError.message}`);
    logStep("Tiers fetched", { count: tiers?.length || 0 });

    if (!tiers || tiers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No tiers to process",
          results: [],
          summary: { total: 0, ok: 0, repaired: 0, created: 0, errors: 0 },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const results: TierRepairResult[] = [];

    for (const tier of tiers) {
      const artistProfiles = tier.artist_profiles as unknown as { artist_name: string } | { artist_name: string }[];
      const artistName = Array.isArray(artistProfiles) 
        ? artistProfiles[0]?.artist_name || "Unknown"
        : artistProfiles?.artist_name || "Unknown";
      
      try {
        // If already has valid stripe_price_id and mode is scan, just check validity
        if (tier.stripe_price_id && mode === "scan") {
          try {
            await stripe.prices.retrieve(tier.stripe_price_id);
            results.push({
              tier_id: tier.id,
              tier_name: tier.name,
              artist_name: artistName,
              status: "ok",
              message: "Stripe price is valid",
              stripe_product_id: tier.stripe_product_id || undefined,
              stripe_price_id: tier.stripe_price_id,
            });
            continue;
          } catch {
            logStep("Stripe price invalid", { tierId: tier.id, priceId: tier.stripe_price_id });
          }
        }

        // Skip repair if mode is just scan
        if (mode === "scan" && tier.stripe_price_id) {
          results.push({
            tier_id: tier.id,
            tier_name: tier.name,
            artist_name: artistName,
            status: "error",
            message: "Stripe price ID exists but is invalid",
            stripe_price_id: tier.stripe_price_id,
          });
          continue;
        }

        if (mode === "scan") {
          results.push({
            tier_id: tier.id,
            tier_name: tier.name,
            artist_name: artistName,
            status: "error",
            message: "Missing Stripe price ID",
          });
          continue;
        }

        // REPAIR MODE: Try to recover existing Stripe objects first
        logStep("Attempting repair for tier", { tierId: tier.id, tierName: tier.name });

        let product: Stripe.Product | null = null;
        let price: Stripe.Price | null = null;

        // Try to find existing product by metadata
        const existingProducts = await stripe.products.search({
          query: `metadata['tier_id']:'${tier.id}'`,
        });

        if (existingProducts.data.length > 0) {
          product = existingProducts.data[0];
          logStep("Found existing product", { productId: product.id });

          // Find active price for this product
          const existingPricesResult = await stripe.prices.list({
            product: product.id,
            active: true,
            limit: 10,
          });

          const matchingPrice = existingPricesResult.data.find(
            (p: Stripe.Price) => p.unit_amount === tier.price_cents && p.currency === (tier.currency || "SEK").toLowerCase()
          );

          if (matchingPrice) {
            price = matchingPrice;
            logStep("Found existing price", { priceId: price.id });
          }
        }

        // Create product if not found
        if (!product) {
          product = await stripe.products.create({
            name: `${artistName} - ${tier.name}`,
            description: tier.description || `Supporter tier for ${artistName}`,
            metadata: {
              artist_id: tier.artist_id,
              tier_id: tier.id,
              tier_type: "custom_supporter",
              flymusic_platform: "true",
            },
          }, {
            idempotencyKey: `repair-product-${tier.id}`,
          });
          logStep("Created new product", { productId: product.id });
        }

        // Create price if not found
        if (!price) {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: tier.price_cents,
            currency: (tier.currency || "SEK").toLowerCase(),
            recurring: { interval: "month" },
            metadata: {
              tier_id: tier.id,
              artist_id: tier.artist_id,
            },
          }, {
            idempotencyKey: `repair-price-${tier.id}-${tier.price_cents}`,
          });
          logStep("Created new price", { priceId: price.id });
        }

        // Update database
        const { error: updateError } = await supabaseClient
          .from("supporter_tiers")
          .update({
            stripe_product_id: product.id,
            stripe_price_id: price.id,
          })
          .eq("id", tier.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        results.push({
          tier_id: tier.id,
          tier_name: tier.name,
          artist_name: artistName,
          status: existingProducts.data.length > 0 ? "repaired" : "created",
          message: existingProducts.data.length > 0 
            ? "Recovered existing Stripe objects" 
            : "Created new Stripe product and price",
          stripe_product_id: product.id,
          stripe_price_id: price.id,
        });

      } catch (tierError) {
        const errorMsg = tierError instanceof Error ? tierError.message : String(tierError);
        logStep("Error processing tier", { tierId: tier.id, error: errorMsg });
        results.push({
          tier_id: tier.id,
          tier_name: tier.name,
          artist_name: artistName,
          status: "error",
          message: errorMsg,
        });
      }
    }

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      repaired: results.filter((r) => r.status === "repaired").length,
      created: results.filter((r) => r.status === "created").length,
      errors: results.filter((r) => r.status === "error").length,
    };

    logStep("Repair complete", summary);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        results,
        summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
