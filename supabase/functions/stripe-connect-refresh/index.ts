import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-CONNECT-REFRESH] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get artist profile
    const { data: artist, error: artistError } = await supabaseClient
      .from('artist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (artistError || !artist) {
      throw new Error("Artist profile not found");
    }

    // Get existing Connect account
    const { data: stripeAccount, error: accountError } = await supabaseClient
      .from('artist_stripe_accounts')
      .select('*')
      .eq('artist_id', artist.id)
      .maybeSingle();

    if (!stripeAccount) {
      return new Response(JSON.stringify({ 
        hasAccount: false,
        status: 'not_started',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch account status from Stripe
    const account = await stripe.accounts.retrieve(stripeAccount.stripe_account_id);
    logStep("Retrieved Stripe account", { 
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });

    // Determine status
    let status = 'pending';
    if (account.details_submitted && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted) {
      status = 'restricted';
    } else {
      status = 'onboarding';
    }

    // Update database
    const { error: updateError } = await supabaseClient
      .from('artist_stripe_accounts')
      .update({
        status,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stripeAccount.id);

    if (updateError) {
      logStep("Error updating account", { error: updateError });
    }

    return new Response(JSON.stringify({ 
      hasAccount: true,
      status,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Error", { error: error instanceof Error ? error.message : error });
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
