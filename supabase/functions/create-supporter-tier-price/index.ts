import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUPPORTER-TIER-PRICE] ${step}${detailsStr}`);
};

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

    // Get artist profile
    const { data: artist, error: artistError } = await supabaseClient
      .from("artist_profiles")
      .select("id, artist_name")
      .eq("user_id", userId)
      .single();

    if (artistError || !artist) throw new Error("Artist profile not found");
    logStep("Artist found", { artistId: artist.id, artistName: artist.artist_name });

    // Parse request body
    const body = await req.json();
    const { tier_id, name, price_cents, currency, description, features, is_active, sort_order } = body;

    if (!name || !price_cents) {
      throw new Error("Name and price_cents are required");
    }

    logStep("Request body parsed", { tier_id, name, price_cents, currency });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Generate a unique tier ID if creating new
    const effectiveTierId = tier_id || crypto.randomUUID();
    const tierCurrency = (currency || "SEK").toLowerCase();

    // Create or update Stripe Product with idempotency
    logStep("Creating Stripe product", { tierId: effectiveTierId });
    
    let product: Stripe.Product;
    try {
      product = await stripe.products.create({
        name: `${artist.artist_name} - ${name}`,
        description: description || `Supporter tier for ${artist.artist_name}`,
        metadata: {
          artist_id: artist.id,
          tier_id: effectiveTierId,
          tier_type: "custom_supporter",
          flymusic_platform: "true",
        },
      }, {
        idempotencyKey: `tier-product-${effectiveTierId}`,
      });
      logStep("Stripe product created", { productId: product.id });
    } catch (stripeError: unknown) {
      // If idempotency error, search for existing product
      if (stripeError instanceof Error && stripeError.message.includes("idempotency")) {
        logStep("Idempotency hit, searching for existing product");
        const existingProducts = await stripe.products.search({
          query: `metadata['tier_id']:'${effectiveTierId}'`,
        });
        if (existingProducts.data.length > 0) {
          product = existingProducts.data[0];
          logStep("Found existing product", { productId: product.id });
        } else {
          throw stripeError;
        }
      } else {
        throw stripeError;
      }
    }

    // Create Stripe Price with idempotency
    logStep("Creating Stripe price", { amount: price_cents, currency: tierCurrency });
    
    let price: Stripe.Price;
    try {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: price_cents,
        currency: tierCurrency,
        recurring: { interval: "month" },
        metadata: {
          tier_id: effectiveTierId,
          artist_id: artist.id,
        },
      }, {
        idempotencyKey: `tier-price-${effectiveTierId}-${price_cents}-${tierCurrency}`,
      });
      logStep("Stripe price created", { priceId: price.id });
    } catch (stripeError: unknown) {
      // If idempotency error, find existing price
      if (stripeError instanceof Error && stripeError.message.includes("idempotency")) {
        logStep("Idempotency hit, searching for existing price");
        const existingPrices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 10,
        });
        const matchingPrice = existingPrices.data.find(
          (p: Stripe.Price) => p.unit_amount === price_cents && p.currency === tierCurrency
        );
        if (matchingPrice) {
          price = matchingPrice;
          logStep("Found existing price", { priceId: price.id });
        } else {
          throw stripeError;
        }
      } else {
        throw stripeError;
      }
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Upsert tier to database
    const tierData = {
      id: effectiveTierId,
      artist_id: artist.id,
      name,
      slug,
      price_cents,
      currency: currency || "SEK",
      description: description || null,
      features: features || [],
      is_active: is_active !== false,
      sort_order: sort_order ?? 0,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
    };

    logStep("Upserting tier to database", { tierId: effectiveTierId });

    const { data: upsertedTier, error: upsertError } = await supabaseClient
      .from("supporter_tiers")
      .upsert(tierData, { onConflict: "id" })
      .select()
      .single();

    if (upsertError) {
      logStep("Database upsert error", { error: upsertError.message });
      throw new Error(`Failed to save tier: ${upsertError.message}`);
    }

    logStep("Tier saved successfully", { tierId: upsertedTier.id });

    return new Response(
      JSON.stringify({
        success: true,
        tier: upsertedTier,
        stripe: {
          product_id: product.id,
          price_id: price.id,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
