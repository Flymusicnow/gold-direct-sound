import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe price mappings
const PLAN_PRICES: Record<string, { monthly: string; yearly: string }> = {
  artist_pro: { 
    monthly: 'price_1R8tksCSRAUHY3L4Al3DoQXx', 
    yearly: 'price_1R8tmuCSRAUHY3L4RiElfbPy' 
  },
  artist_elite: { 
    monthly: 'price_1RCze6CSRAUHY3L45cQRFvbt', 
    yearly: 'price_1RCzg0CSRAUHY3L4ifp9CU8V' 
  },
  fan_supporter: { 
    monthly: 'price_1R8tWZCSRAUHY3L4EEgfl4oG', 
    yearly: 'price_1R8tiRCSRAUHY3L4eY5b9rBW' 
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan_key, billing_interval = 'month' } = await req.json();
    logStep("Request params", { plan_key, billing_interval });

    // Validate plan
    const planPrices = PLAN_PRICES[plan_key];
    if (!planPrices) {
      throw new Error(`Invalid plan key: ${plan_key}`);
    }

    const priceId = billing_interval === 'year' ? planPrices.yearly : planPrices.monthly;
    if (!priceId) {
      throw new Error(`Price not found for ${plan_key} ${billing_interval}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Check for existing active subscription to this plan
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10
      });
      
      for (const sub of subscriptions.data) {
        const subPriceId = sub.items.data[0]?.price.id;
        if (subPriceId === planPrices.monthly || subPriceId === planPrices.yearly) {
          throw new Error("You already have an active subscription to this plan");
        }
      }
    }

    const origin = req.headers.get("origin") || "https://flymusic.se";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        user_id: user.id,
        plan_key,
        billing_interval,
        type: 'platform_subscription'
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_key,
          type: 'platform_subscription'
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
