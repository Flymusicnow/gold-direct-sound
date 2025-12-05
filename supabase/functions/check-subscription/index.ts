import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Stripe price IDs to plan keys
const PRICE_TO_PLAN: Record<string, string> = {
  'price_1R8tksCSRAUHY3L4Al3DoQXx': 'artist_pro',
  'price_1R8tmuCSRAUHY3L4RiElfbPy': 'artist_pro',
  'price_1RCze6CSRAUHY3L45cQRFvbt': 'artist_elite',
  'price_1RCzg0CSRAUHY3L4ifp9CU8V': 'artist_elite',
  'price_1R8tWZCSRAUHY3L4EEgfl4oG': 'fan_supporter',
  'price_1R8tiRCSRAUHY3L4eY5b9rBW': 'fan_supporter',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_key: null,
        tier: 'free',
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      
      // Update user_subscriptions to reflect no active subscription
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      return new Response(JSON.stringify({
        subscribed: false,
        plan_key: null,
        tier: 'free',
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the first active subscription and determine plan
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    const planKey = PRICE_TO_PLAN[priceId] || null;
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Determine tier from plan key
    let tier = 'free';
    if (planKey?.includes('elite')) tier = 'elite';
    else if (planKey?.includes('pro')) tier = 'pro';
    else if (planKey?.includes('supporter')) tier = 'supporter';

    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      priceId, 
      planKey, 
      tier,
      endDate: subscriptionEnd 
    });

    // Upsert to user_subscriptions table
    await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_key: planKey,
        status: 'active',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        expires_at: subscriptionEnd
      }, { 
        onConflict: 'user_id' 
      });

    return new Response(JSON.stringify({
      subscribed: true,
      plan_key: planKey,
      tier,
      subscription_end: subscriptionEnd,
      stripe_subscription_id: subscription.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
