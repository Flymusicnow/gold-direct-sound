import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, User, Building2, Check, X, Sparkles, Loader2, Shield, Zap, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PricingCard } from "@/components/premium/PricingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { STRIPE_PLANS } from "@/config/stripePlans";
import { toast } from "sonner";
import { useAppConfig } from "@/hooks/useAppConfig";
import { isPaymentsEnabled } from "@/config/mvpConfig";

const artistPlans = [
  {
    key: "artist_free",
    name: STRIPE_PLANS.artist_free.name,
    price: 0,
    yearlyPrice: 0,
    description: "Get started with the essentials",
    features: [
      "Upload up to 5 tracks",
      "Basic artist profile",
      "Fan engagement tools",
      "Spotlight entry (1/month)",
      "Basic analytics"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    key: "artist_pro",
    name: STRIPE_PLANS.artist_pro.name,
    price: STRIPE_PLANS.artist_pro.monthly.amount / 100,
    yearlyPrice: STRIPE_PLANS.artist_pro.yearly.amount / 100,
    description: "Everything you need to grow",
    features: [
      "Unlimited track uploads",
      "Advanced analytics dashboard",
      "Priority Spotlight placement",
      "Promo OS smart links",
      "Presskit / EPK builder",
      "Collaboration requests",
      "Custom supporter tiers"
    ],
    cta: "Upgrade to Pro",
    popular: true
  },
  {
    key: "artist_elite",
    name: STRIPE_PLANS.artist_elite.name,
    price: STRIPE_PLANS.artist_elite.monthly.amount / 100,
    yearlyPrice: STRIPE_PLANS.artist_elite.yearly.amount / 100,
    description: "For serious artists",
    features: [
      "Everything in Pro",
      "AI-powered bio & content tools",
      "Brand collaboration matching",
      "Dedicated support",
      "Featured artist placement",
      "Revenue optimization tools",
      "White-label presskit"
    ],
    cta: "Go Elite",
    popular: false
  }
];

const fanPlans = [
  {
    key: "fan_free",
    name: STRIPE_PLANS.fan_free.name,
    price: 0,
    yearlyPrice: 0,
    description: "Discover and support artists",
    features: [
      "Unlimited music streaming",
      "Follow unlimited artists",
      "Create stacks (playlists)",
      "Vote in Spotlight",
      "Basic XP earning"
    ],
    cta: "Join Free",
    popular: false
  },
  {
    key: "fan_supporter",
    name: STRIPE_PLANS.fan_supporter.name,
    price: STRIPE_PLANS.fan_supporter.monthly.amount / 100,
    yearlyPrice: STRIPE_PLANS.fan_supporter.yearly.amount / 100,
    description: "Unlock the full fan experience",
    features: [
      "Everything in Free",
      "2x XP multiplier",
      "Exclusive content access",
      "Early access to releases",
      "Supporter badge on profile",
      "Priority event access",
      "Ad-free experience"
    ],
    cta: "Become a Supporter",
    popular: true
  }
];

const brandPlans = [
  {
    key: "brand_lite",
    name: STRIPE_PLANS.brand_lite.name,
    price: 0,
    yearlyPrice: 0,
    description: "Explore artist partnerships",
    features: [
      "Browse artist directory",
      "Basic search filters",
      "View public presskits",
      "5 artist contacts/month"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    key: "brand_pro",
    name: STRIPE_PLANS.brand_pro.name,
    price: STRIPE_PLANS.brand_pro.monthly.amount ? STRIPE_PLANS.brand_pro.monthly.amount / 100 : 999,
    yearlyPrice: STRIPE_PLANS.brand_pro.yearly.amount ? STRIPE_PLANS.brand_pro.yearly.amount / 100 : 9990,
    description: "Scale your artist partnerships",
    features: [
      "Everything in Lite",
      "AI-powered match engine",
      "Unlimited artist contacts",
      "Campaign management",
      "Performance analytics",
      "Priority support"
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    key: "brand_enterprise",
    name: STRIPE_PLANS.brand_enterprise.name,
    price: null,
    yearlyPrice: null,
    description: "Custom solutions for large organizations",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees",
      "Bulk licensing deals",
      "API access"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

const artistFeatureComparison = [
  { feature: "Track uploads", free: "5", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Analytics", free: "Basic", pro: "Advanced", elite: "AI-powered" },
  { feature: "Spotlight placement", free: "1/month", pro: "Priority", elite: "Featured" },
  { feature: "Promo OS smart links", free: false, pro: true, elite: true },
  { feature: "Presskit / EPK", free: false, pro: true, elite: "White-label" },
  { feature: "Brand matching", free: false, pro: false, elite: true },
  { feature: "Dedicated support", free: false, pro: false, elite: true },
];

const faqs = [
  {
    question: "Can I switch plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, your new plan takes effect at the next billing cycle."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers through Stripe. All payments are processed securely."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "All users receive a free trial period with full feature access. No credit card required to start."
  },
  {
    question: "What happens if I cancel?",
    answer: "You can cancel anytime. Your subscription will remain active until the end of your billing period, and you won't be charged again."
  },
  {
    question: "Do artists keep 100% of their earnings?",
    answer: "Artists receive 70% of all fan support revenue. FlyMusic takes a 20% platform fee and 10% goes to payment processing."
  }
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { subscription, isLoading: subLoading } = useUserSubscription();
  const { config } = useAppConfig();
  
  // Check if payments are enabled (uses AppConfig, falls back to MVP_CONFIG)
  const paymentsEnabled = isPaymentsEnabled(config);

  // Determine which sections to show based on user role
  const showArtistPlans = !user || hasRole('artist') || (!hasRole('fan') && !hasRole('brand'));
  const showFanPlans = !user || hasRole('fan') || (!hasRole('artist') && !hasRole('brand'));
  const showBrandPlans = !user || hasRole('brand') || (!hasRole('artist') && !hasRole('fan'));

  // If user has a specific role, only show their pricing
  const userHasSpecificRole = user && (hasRole('artist') || hasRole('fan') || hasRole('brand'));
  const showOnlyRelevant = userHasSpecificRole;

  const isCurrentPlan = (planKey: string) => {
    if (!subscription || subscription.tier === 'free') {
      return planKey.includes('free');
    }
    // Map subscription tier to plan key
    const tierToPlanKey: Record<string, string> = {
      'pro': 'artist_pro',
      'elite': 'artist_elite',
      'supporter': 'fan_supporter',
    };
    return tierToPlanKey[subscription.tier] === planKey;
  };

  const handleSubscribe = async (planKey: string, cta: string) => {
    // MVP: Block ALL paid checkouts via single flag
    if (!paymentsEnabled) {
      // Only allow enterprise contact and free plan signup
      if (planKey === 'brand_enterprise') {
        window.location.href = 'mailto:partnerships@flymusic.se?subject=Brand%20Enterprise%20Inquiry';
        return;
      }
      if (planKey.includes('free')) {
        navigate('/auth');
        return;
      }
      // Block all other checkouts
      toast.info("Premium plans coming after MVP. All features available during trial!");
      return;
    }

    // Post-MVP: Normal checkout flow
    // Free plans or contact sales - just navigate
    if (planKey.includes('free') || planKey === 'brand_enterprise') {
      if (planKey === 'brand_enterprise') {
        window.location.href = 'mailto:partnerships@flymusic.se?subject=Brand%20Enterprise%20Inquiry';
      } else {
        navigate('/auth');
      }
      return;
    }

    // Not logged in - redirect to auth
    if (!user) {
      navigate(`/auth?redirect=/pricing`);
      return;
    }

    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          plan_key: planKey,
          billing_interval: isYearly ? 'year' : 'month'
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
    if (value === false) return <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />;
    return <span className="text-sm">{value}</span>;
  };

  // Get page title based on role
  const getPageTitle = () => {
    if (!user) return "Simple, transparent pricing";
    if (hasRole('artist')) return "Artist Pricing";
    if (hasRole('fan')) return "Fan Pricing";
    if (hasRole('brand')) return "Brand Pricing";
    return "Simple, transparent pricing";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Back Button */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {getPageTitle()}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {user ? "Choose the plan that's right for you." : "Choose the plan that's right for you. Upgrade anytime as you grow."}
          </p>
          
          {/* MVP Trial Banner */}
          {!paymentsEnabled && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-sm text-center">
                <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
                <strong>MVP Mode:</strong> All premium features are available FREE during your trial period.
              </p>
            </div>
          )}
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 sticky top-20 z-10 bg-background/80 backdrop-blur-sm py-3 md:static md:bg-transparent md:backdrop-blur-none">
            <span className={`text-sm ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly <Badge variant="secondary" className="ml-1">Save 17%</Badge>
            </span>
          </div>
        </div>

        {/* Artists Section - Show if user is artist or unauthenticated */}
        {(showOnlyRelevant ? hasRole('artist') : showArtistPlans) && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-2">
                <Music className="h-3 w-3 mr-1" />
                For Artists
              </Badge>
              <h2 className="text-2xl font-bold">Build your audience, your way</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {artistPlans.map(plan => (
                <PricingCard
                  key={plan.key}
                  name={plan.name}
                  description={plan.description}
                  price={isYearly ? plan.yearlyPrice : plan.price}
                  period={isYearly ? "year" : "month"}
                  features={plan.features}
                  ctaText={loadingPlan === plan.key ? "Processing..." : plan.cta}
                  onCtaClick={() => handleSubscribe(plan.key, plan.cta)}
                  popular={plan.popular}
                  currentPlan={isCurrentPlan(plan.key)}
                  icon={<Music className="h-6 w-6 text-primary" />}
                  disabled={loadingPlan === plan.key || subLoading}
                  mvpLocked={!paymentsEnabled && !plan.key.includes('free')}
                />
              ))}
            </div>

            {/* Artist Feature Comparison */}
            <div className="mt-8 max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="artist-comparison">
                  <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground">
                    Compare Artist Plans
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium">Feature</th>
                            <th className="text-center py-3 px-4 font-medium">Free</th>
                            <th className="text-center py-3 px-4 font-medium text-primary">Pro</th>
                            <th className="text-center py-3 px-4 font-medium">Elite</th>
                          </tr>
                        </thead>
                        <tbody>
                          {artistFeatureComparison.map((row, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-3 px-4 text-muted-foreground">{row.feature}</td>
                              <td className="py-3 px-4 text-center">{renderFeatureValue(row.free)}</td>
                              <td className="py-3 px-4 text-center bg-primary/5">{renderFeatureValue(row.pro)}</td>
                              <td className="py-3 px-4 text-center">{renderFeatureValue(row.elite)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        )}

        {/* Fans Section - Show if user is fan or unauthenticated */}
        {(showOnlyRelevant ? hasRole('fan') : showFanPlans) && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-2">
                <User className="h-3 w-3 mr-1" />
                For Fans
              </Badge>
              <h2 className="text-2xl font-bold">Get closer to the music you love</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {fanPlans.map(plan => (
                <PricingCard
                  key={plan.key}
                  name={plan.name}
                  description={plan.description}
                  price={isYearly ? plan.yearlyPrice : plan.price}
                  period={isYearly ? "year" : "month"}
                  features={plan.features}
                  ctaText={loadingPlan === plan.key ? "Processing..." : plan.cta}
                  onCtaClick={() => handleSubscribe(plan.key, plan.cta)}
                  popular={plan.popular}
                  currentPlan={isCurrentPlan(plan.key)}
                  icon={<User className="h-6 w-6 text-primary" />}
                  disabled={loadingPlan === plan.key || subLoading}
                  mvpLocked={!paymentsEnabled && !plan.key.includes('free')}
                />
              ))}
            </div>
          </section>
        )}

        {/* Brands Section - Show if user is brand or unauthenticated */}
        {(showOnlyRelevant ? hasRole('brand') : showBrandPlans) && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-2">
                <Building2 className="h-3 w-3 mr-1" />
                For Brands & Partners
              </Badge>
              <h2 className="text-2xl font-bold">Connect with authentic artists</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {brandPlans.map(plan => (
                <PricingCard
                  key={plan.key}
                  name={plan.name}
                  description={plan.description}
                  price={isYearly && plan.yearlyPrice !== null ? plan.yearlyPrice : plan.price}
                  period={isYearly ? "year" : "month"}
                  features={plan.features}
                  ctaText={loadingPlan === plan.key ? "Processing..." : plan.cta}
                  onCtaClick={() => handleSubscribe(plan.key, plan.cta)}
                  popular={plan.popular}
                  currentPlan={isCurrentPlan(plan.key)}
                  icon={<Building2 className="h-6 w-6 text-primary" />}
                  disabled={loadingPlan === plan.key || subLoading}
                  mvpLocked={!paymentsEnabled && !plan.key.includes('free') && plan.key !== 'brand_enterprise'}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trust Signals */}
        <section className="text-center py-12 border-t border-border mb-12">
          <div className="flex flex-wrap justify-center gap-8 items-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Secure payments via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <span>Full feature access during trial</span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
};

export default Pricing;