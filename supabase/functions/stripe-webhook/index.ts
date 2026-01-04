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
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[STRIPE-WEBHOOK][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    log('ERROR', { reason: 'no_signature' });
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);

    log('WEBHOOK_RECEIVED', { type: event.type });

    switch (event.type) {
      // Handle Stripe Connect account updates
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        log('ACCOUNT_UPDATED', { accountId: account.id });

        // Find the artist with this Stripe account
        const { data: stripeAccount } = await supabaseAdmin
          .from('artist_stripe_accounts')
          .select('id, artist_id')
          .eq('stripe_account_id', account.id)
          .maybeSingle();

        if (stripeAccount) {
          // Determine status
          let status = 'pending';
          if (account.details_submitted && account.payouts_enabled) {
            status = 'active';
          } else if (account.details_submitted) {
            status = 'restricted';
          } else {
            status = 'onboarding';
          }

          await supabaseAdmin
            .from('artist_stripe_accounts')
            .update({
              status,
              payouts_enabled: account.payouts_enabled,
              details_submitted: account.details_submitted,
              updated_at: new Date().toISOString(),
            })
            .eq('id', stripeAccount.id);

          log('ARTIST_STRIPE_UPDATED', { 
            artistId: stripeAccount.artist_id, 
            status,
            payoutsEnabled: account.payouts_enabled 
          });
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        
        // Check if this is a platform subscription (Artist Pro/Elite, Fan Supporter)
        if (metadata.type === 'platform_subscription') {
          const { user_id, plan_key, billing_interval } = metadata;
          
          if (!user_id || !plan_key) {
            log('ERROR', { reason: 'missing_metadata', metadata });
            break;
          }
          
          log('PROCESSING_PLATFORM_SUBSCRIPTION', { user_id, plan_key, billing_interval });
          
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Upsert to user_subscriptions table
          await supabaseAdmin
            .from('user_subscriptions')
            .upsert({
              user_id,
              plan_key,
              status: 'active',
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              expires_at: new Date(subscription.current_period_end * 1000).toISOString()
            }, { 
              onConflict: 'user_id' 
            });
          
          // Create notification for user
          const planNames: Record<string, string> = {
            artist_pro: 'Artist Pro',
            artist_elite: 'Artist Elite',
            fan_supporter: 'Supporter Pass'
          };
          
          await supabaseAdmin.from('notifications').insert({
            user_id,
            type: 'subscription_activated',
            title: '🎉 Welcome to ' + (planNames[plan_key] || 'Premium') + '!',
            message: 'Your premium features are now unlocked. Thank you for supporting FlyMusic!',
            link: plan_key.startsWith('fan') ? '/fan/settings' : '/studio/settings'
          });
          
          log('PLATFORM_SUBSCRIPTION_CREATED', { user_id, plan_key });
          break;
        }
        
        // Existing fan→artist supporter subscription logic
        const { fan_user_id, artist_id, tier, tier_id } = metadata;

        if (!fan_user_id || !artist_id || !tier) {
          log('ERROR', { reason: 'missing_metadata', metadata });
          break;
        }

        log('PROCESSING_CHECKOUT', { fan_user_id, artist_id, tier, tier_id });

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Create subscription record with tier_id if present
        const subscriptionData: Record<string, unknown> = {
          fan_user_id,
          artist_id,
          tier,
          status: "active",
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          total_paid: session.amount_total ? session.amount_total / 100 : 0,
        };

        if (tier_id) {
          subscriptionData.tier_id = tier_id;
        }

        const { data: newSubscription, error: subError } = await supabaseAdmin
          .from("supporter_subscriptions")
          .insert(subscriptionData)
          .select()
          .single();

        if (subError) {
          log('ERROR', { reason: 'subscription_insert_failed', error: subError.message });
        }

        // Log initial payment to supporter_payments
        if (newSubscription && session.amount_total) {
          await supabaseAdmin.from("supporter_payments").insert({
            subscription_id: newSubscription.id,
            amount: session.amount_total / 100,
            currency: session.currency?.toUpperCase() || 'SEK',
            paid_at: new Date().toISOString(),
            stripe_event_id: event.id,
            type: 'subscription',
          });
        }

        // Calculate artist payout (70% - only if no Connect, otherwise Stripe handles it)
        const { data: stripeAccount } = await supabaseAdmin
          .from('artist_stripe_accounts')
          .select('payouts_enabled')
          .eq('artist_id', artist_id)
          .maybeSingle();

        // Only track manual payout if artist doesn't have active Connect
        if (!stripeAccount?.payouts_enabled) {
          const amount = session.amount_total ? (session.amount_total / 100) * 0.7 : 0;
          
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

            log('MANUAL_PAYOUT_TRACKED', { artistUserId: artist.user_id, amount });
          }
        } else {
          log('STRIPE_CONNECT_HANDLES_PAYOUT');
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

        log('SUBSCRIPTION_CREATED', { fan_user_id, artist_id, xpBonus });
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

        log('PROCESSING_INVOICE', { subscriptionId, amount: invoice.amount_paid });

        // Log payment with full details
        await supabaseAdmin.from("supporter_payments").insert({
          subscription_id: subscription.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          stripe_event_id: event.id,
          stripe_invoice_id: invoice.id,
          type: 'subscription',
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

        // Update artist earnings (70%) - only if no Connect
        const { data: stripeAccount } = await supabaseAdmin
          .from('artist_stripe_accounts')
          .select('payouts_enabled')
          .eq('artist_id', subscription.artist_id)
          .maybeSingle();

        if (!stripeAccount?.payouts_enabled) {
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
        }

        log('INVOICE_PROCESSED', { subscriptionId });
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

        log('PAYMENT_FAILED', { subscriptionId });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Map Stripe status to DB status per SUPER CARD
        const STATUS_MAP: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'cancelled',
          unpaid: 'expired',
          incomplete: 'pending',
          incomplete_expired: 'expired',
          trialing: 'active',
          paused: 'past_due',
        };
        
        const dbStatus = STATUS_MAP[subscription.status] || subscription.status;
        
        await supabaseAdmin
          .from("supporter_subscriptions")
          .update({
            status: dbStatus,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        log('SUBSCRIPTION_UPDATED', { subscriptionId: subscription.id, stripeStatus: subscription.status, dbStatus });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from("supporter_subscriptions")
          .update({
            status: "cancelled",
            current_period_end: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        log('SUBSCRIPTION_CANCELED', { subscriptionId: subscription.id });
        break;
      }
    }

    // Persist log
    await supabaseAdmin.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'stripe-webhook',
      step: event.type,
      level: 'info',
      message: `Processed ${event.type}`,
      details: { event_id: event.id },
      execution_time_ms: Date.now() - startTime,
      status_code: 200
    });

    return new Response(JSON.stringify({ received: true, correlation_id: correlationId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    log('ERROR', { error: error instanceof Error ? error.message : String(error) });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, correlation_id: correlationId }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
