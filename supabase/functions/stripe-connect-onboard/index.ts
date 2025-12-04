import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-CONNECT-ONBOARD] ${step}`, details ? JSON.stringify(details) : '');
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get artist profile
    const { data: artist, error: artistError } = await supabaseClient
      .from('artist_profiles')
      .select('id, artist_name, user_id')
      .eq('user_id', user.id)
      .single();

    if (artistError || !artist) {
      throw new Error("Artist profile not found - only artists can onboard to Stripe Connect");
    }
    logStep("Artist profile found", { artistId: artist.id, artistName: artist.artist_name });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if artist already has a Connect account
    const { data: existingAccount } = await supabaseClient
      .from('artist_stripe_accounts')
      .select('stripe_account_id, status, payouts_enabled')
      .eq('artist_id', artist.id)
      .maybeSingle();

    let stripeAccountId: string;

    if (existingAccount?.stripe_account_id) {
      // Use existing account
      stripeAccountId = existingAccount.stripe_account_id;
      logStep("Using existing Connect account", { stripeAccountId });
    } else {
      // Create new Connect account (Standard type)
      const account = await stripe.accounts.create({
        type: 'standard',
        email: user.email,
        metadata: {
          flymusic_artist_id: artist.id,
          flymusic_user_id: user.id,
        },
      });
      stripeAccountId = account.id;
      logStep("Created new Connect account", { stripeAccountId });

      // Save to database
      const { error: insertError } = await supabaseClient
        .from('artist_stripe_accounts')
        .insert({
          artist_id: artist.id,
          stripe_account_id: stripeAccountId,
          status: 'pending',
          payouts_enabled: false,
          details_submitted: false,
        });

      if (insertError) {
        logStep("Error saving account", { error: insertError });
        throw new Error("Failed to save Stripe account");
      }
    }

    // Generate onboarding link
    const origin = req.headers.get("origin") || "https://flymusic.se";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/studio/earnings?refresh=true`,
      return_url: `${origin}/studio/earnings?onboarding=complete`,
      type: 'account_onboarding',
    });

    logStep("Created account link", { url: accountLink.url });

    return new Response(JSON.stringify({ 
      url: accountLink.url,
      accountId: stripeAccountId,
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
