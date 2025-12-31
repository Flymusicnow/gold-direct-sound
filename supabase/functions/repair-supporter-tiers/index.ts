import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[REPAIR-SUPPORTER-TIERS][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('STARTING');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log('AUTH_ERROR', { reason: 'no_header' });
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      log('AUTH_ERROR', { reason: 'user_verification_failed', error: userError?.message });
      throw new Error("Authentication failed");
    }
    
    const userId = userData.user.id;
    log('USER_AUTHENTICATED', { userId });

    // Admin check (user can have multiple roles)
    const { data: adminRoles, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);

    if (roleError) {
      log('AUTH_ERROR', { reason: 'role_check_failed', error: roleError.message });
      return new Response(
        JSON.stringify({ error: "Admin access required", correlation_id: correlationId }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = (adminRoles?.length ?? 0) > 0;

    if (!isAdmin) {
      log('AUTH_ERROR', { reason: 'not_admin', userId });
      return new Response(
        JSON.stringify({ error: "Admin access required", correlation_id: correlationId }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    log('ADMIN_VERIFIED');

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { tier_id, mode = "scan" } = body; // mode: "scan" | "repair" | "repair_single"

    log('REQUEST_PARSED', { mode, tier_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log('CONFIG_ERROR', { reason: 'missing_stripe_key' });
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
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

    if (tiersError) {
      log('DB_ERROR', { reason: 'fetch_tiers_failed', error: tiersError.message });
      throw new Error(`Failed to fetch tiers: ${tiersError.message}`);
    }
    log('TIERS_FETCHED', { count: tiers?.length || 0 });

    if (!tiers || tiers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No tiers to process",
          results: [],
          summary: { total: 0, ok: 0, repaired: 0, created: 0, errors: 0 },
          correlation_id: correlationId,
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
            log('STRIPE_PRICE_INVALID', { tierId: tier.id, priceId: tier.stripe_price_id });
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
        log('REPAIRING_TIER', { tierId: tier.id, tierName: tier.name });

        let product: Stripe.Product | null = null;
        let price: Stripe.Price | null = null;

        // Try to find existing product by metadata
        const existingProducts = await stripe.products.search({
          query: `metadata['tier_id']:'${tier.id}'`,
        });

        if (existingProducts.data.length > 0) {
          product = existingProducts.data[0];
          log('FOUND_EXISTING_PRODUCT', { productId: product.id });

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
            log('FOUND_EXISTING_PRICE', { priceId: price.id });
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
          log('CREATED_PRODUCT', { productId: product.id });
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
          log('CREATED_PRICE', { priceId: price.id });
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
        log('TIER_ERROR', { tierId: tier.id, error: errorMsg });
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

    log('COMPLETE', { ...summary, execution_time_ms: Date.now() - startTime });

    // Persist log
    await supabaseClient.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'repair-supporter-tiers',
      step: 'COMPLETE',
      level: summary.errors > 0 ? 'warn' : 'info',
      message: `Processed ${summary.total} tiers: ${summary.ok} ok, ${summary.repaired} repaired, ${summary.created} created, ${summary.errors} errors`,
      details: summary,
      execution_time_ms: Date.now() - startTime,
      status_code: 200,
      user_id: userId
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        results,
        summary,
        correlation_id: correlationId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('UNHANDLED_ERROR', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, correlation_id: correlationId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
