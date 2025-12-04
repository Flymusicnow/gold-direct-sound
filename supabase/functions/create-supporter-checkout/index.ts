import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUPPORTER-CHECKOUT] ${step}${detailsStr}`);
};

// Default tier prices (fallback when no custom tiers)
const DEFAULT_PRICES = {
  basic: { priceId: 'price_1SYxCzCSRAUHY3L4d2VZBrg8', priceCents: 4900 },
  gold: { priceId: 'price_1SYxDyCSRAUHY3L4VXlGOcZb', priceCents: 9900 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { artistId, tier, tierId } = await req.json();
    
    if (!artistId || !tier) {
      throw new Error("Missing required fields: artistId, tier");
    }
    logStep("Request params", { artistId, tier, tierId });

    // Get artist profile
    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artist_profiles')
      .select('artist_name, user_id')
      .eq('id', artistId)
      .single();

    if (artistError || !artist) throw new Error("Artist not found");
    logStep("Artist found", { artistName: artist.artist_name });

    // Check if artist has Stripe Connect account
    const { data: stripeAccount } = await supabaseAdmin
      .from('artist_stripe_accounts')
      .select('stripe_account_id, status, payouts_enabled')
      .eq('artist_id', artistId)
      .maybeSingle();

    const hasActiveConnect = stripeAccount?.payouts_enabled === true;
    logStep("Stripe Connect status", { hasActiveConnect, status: stripeAccount?.status });

    // Determine price info
    let priceId: string;
    let priceCents: number;
    let tierIdToStore: string | null = null;

    if (tierId) {
      // Fetch custom tier from database
      const { data: customTier, error: tierError } = await supabaseAdmin
        .from('supporter_tiers')
        .select('*')
        .eq('id', tierId)
        .eq('is_active', true)
        .single();

      if (tierError || !customTier) {
        throw new Error("Custom tier not found or inactive");
      }

      if (!customTier.stripe_price_id) {
        throw new Error("Custom tier has no Stripe price configured");
      }

      priceId = customTier.stripe_price_id;
      priceCents = customTier.price_cents;
      tierIdToStore = tierId;
      logStep("Using custom tier", { tierName: customTier.name, priceCents });
    } else {
      // Use default tiers
      const defaultTier = DEFAULT_PRICES[tier as keyof typeof DEFAULT_PRICES];
      if (!defaultTier) {
        throw new Error(`Invalid tier: ${tier}`);
      }
      priceId = defaultTier.priceId;
      priceCents = defaultTier.priceCents;
      logStep("Using default tier", { tier, priceCents });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/fan/supporter?success=true`,
      cancel_url: `${req.headers.get("origin")}/artist/${artistId}`,
      metadata: {
        fan_user_id: user.id,
        artist_id: artistId,
        tier,
        tier_id: tierIdToStore || '',
      },
    };

    // Add Stripe Connect revenue split if artist has active Connect account
    if (hasActiveConnect && stripeAccount?.stripe_account_id) {
      // 70% to artist, 30% to platform (application_fee)
      const applicationFeeAmount = Math.round(priceCents * 0.30);
      
      sessionParams.subscription_data = {
        application_fee_percent: 30,
        transfer_data: {
          destination: stripeAccount.stripe_account_id,
        },
      };
      
      logStep("Stripe Connect enabled", { 
        destination: stripeAccount.stripe_account_id,
        applicationFeePercent: 30
      });
    } else {
      logStep("No Stripe Connect - platform collects full payment");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-supporter-checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
