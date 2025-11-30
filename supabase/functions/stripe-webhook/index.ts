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
          const { data: existingPayout } = await supabaseAdmin
            .from("artist_payouts")
            .select("amount_due")
            .eq("artist_user_id", artist.user_id)
            .maybeSingle();

          await supabaseAdmin
            .from("artist_payouts")
            .upsert({
              artist_user_id: artist.user_id,
              amount_due: (existingPayout?.amount_due || 0) + amount,
            }, {
              onConflict: 'artist_user_id'
            });
        }

        // Award XP bonus to fan_support_scores
        const xpBonus = tier === 'gold' ? 75 : 25;
        
        const { data: supportScore } = await supabaseAdmin
          .from("fan_support_scores")
          .select("score")
          .eq("fan_user_id", fan_user_id)
          .eq("artist_id", artist_id)
          .maybeSingle();

        await supabaseAdmin
          .from("fan_support_scores")
          .upsert({
            fan_user_id,
            artist_id,
            score: (supportScore?.score || 0) + xpBonus,
          }, {
            onConflict: 'fan_user_id,artist_id'
          });

        console.log(`Subscription created for ${fan_user_id} supporting ${artist_id}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const { data: subscription } = await supabaseAdmin
          .from("supporter_subscriptions")
          .select("*")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (!subscription) break;

        // Log payment
        await supabaseAdmin.from("supporter_payments").insert({
          subscription_id: subscription.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          stripe_event_id: event.id,
          stripe_invoice_id: invoice.id,
          raw: invoice,
        });

        // Update subscription total_paid
        await supabaseAdmin
          .from("supporter_subscriptions")
          .update({
            total_paid: (subscription.total_paid || 0) + (invoice.amount_paid / 100),
          })
          .eq("id", subscription.id);

        // Award monthly XP bonus
        const xpBonus = subscription.tier === 'gold' ? 75 : 25;
        
        const { data: supportScore } = await supabaseAdmin
          .from("fan_support_scores")
          .select("score")
          .eq("fan_user_id", subscription.fan_user_id)
          .eq("artist_id", subscription.artist_id)
          .maybeSingle();

        await supabaseAdmin
          .from("fan_support_scores")
          .upsert({
            fan_user_id: subscription.fan_user_id,
            artist_id: subscription.artist_id,
            score: (supportScore?.score || 0) + xpBonus,
          }, {
            onConflict: 'fan_user_id,artist_id'
          });

        // Update artist earnings (70%)
        const artistEarning = (invoice.amount_paid / 100) * 0.7;
        
        const { data: artist } = await supabaseAdmin
          .from('artist_profiles')
          .select('user_id')
          .eq('id', subscription.artist_id)
          .single();

        if (artist) {
          const { data: existingPayout } = await supabaseAdmin
            .from("artist_payouts")
            .select("amount_due")
            .eq("artist_user_id", artist.user_id)
            .maybeSingle();

          await supabaseAdmin
            .from("artist_payouts")
            .upsert({
              artist_user_id: artist.user_id,
              amount_due: (existingPayout?.amount_due || 0) + artistEarning,
            }, {
              onConflict: 'artist_user_id'
            });
        }

        console.log(`Invoice paid for subscription ${subscriptionId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        await supabaseAdmin
          .from("supporter_subscriptions")
          .update({
            status: "past_due",
          })
          .eq("stripe_subscription_id", subscriptionId);

        console.log(`Payment failed for subscription ${subscriptionId}`);
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
