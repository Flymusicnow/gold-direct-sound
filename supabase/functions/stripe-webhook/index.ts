import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { fan_user_id, artist_id, tier } = session.metadata || {};

        if (!fan_user_id || !artist_id || !tier) {
          console.error("Missing metadata in checkout session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Create subscription record
        await supabaseAdmin.from("supporter_subscriptions").insert({
          fan_user_id,
          artist_id,
          tier,
          status: "active",
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          total_paid: session.amount_total ? session.amount_total / 100 : 0,
        });

        // Calculate artist payout (70%)
        const amount = session.amount_total ? (session.amount_total / 100) * 0.7 : 0;
        
        // Get artist user_id
        const { data: artist } = await supabaseAdmin
          .from('artist_profiles')
          .select('user_id')
          .eq('id', artist_id)
          .single();

        if (artist) {
          await supabaseAdmin
            .from("artist_payouts")
            .upsert({
              artist_user_id: artist.user_id,
              amount_due: supabaseAdmin.rpc('increment', { amount }),
            }, {
              onConflict: 'artist_user_id'
            });
        }

        // Award XP bonus to fan_support_scores
        const xpBonus = tier === 'gold' ? 75 : 25;
        await supabaseAdmin.rpc('update_taste_profile', {
          _fan_user_id: fan_user_id,
          _artist_id: artist_id,
          _interaction: 'share',
        });

        console.log(`Subscription created for ${fan_user_id} supporting ${artist_id}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from("supporter_subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`Subscription updated: ${subscription.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from("supporter_subscriptions")
          .update({
            status: "canceled",
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`Subscription canceled: ${subscription.id}`);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
