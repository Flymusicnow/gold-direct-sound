import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, User, Building2, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const artistPlans = [
  {
    key: "artist_free",
    name: "Free",
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
    name: "Pro",
    price: 99,
    yearlyPrice: 990,
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
    name: "Elite",
    price: 249,
    yearlyPrice: 2490,
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
    name: "Free",
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
    name: "Supporter Pass",
    price: 49,
    yearlyPrice: 490,
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
    name: "Lite",
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
    name: "Pro",
    price: 999,
    yearlyPrice: 9990,
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
    name: "Enterprise",
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
    answer: "Artist Pro and Brand Pro plans come with a 14-day free trial. No credit card required to start."
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
  const { user } = useAuth();

  const formatPrice = (price: number | null, yearly: boolean) => {
    if (price === null) return "Custom";
    if (price === 0) return "Free";
    return `${yearly ? Math.round(price / 12) : price} SEK`;
  };

  const handleSubscribe = async (planKey: string, cta: string) => {
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

  const renderPlanCard = (plan: typeof artistPlans[0], icon: React.ReactNode, userType: string) => (
    <Card 
      key={plan.key}
      className={`relative flex flex-col ${plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          <Sparkles className="h-3 w-3 mr-1" />
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-primary">
            {formatPrice(isYearly ? plan.yearlyPrice : plan.price, isYearly)}
          </div>
          {plan.price !== null && plan.price > 0 && (
            <div className="text-sm text-muted-foreground">
              {isYearly ? "/year" : "/month"}
            </div>
          )}
          {isYearly && plan.yearlyPrice && plan.price && plan.price > 0 && (
            <Badge variant="secondary" className="mt-2">
              Save {Math.round((1 - plan.yearlyPrice / (plan.price * 12)) * 100)}%
            </Badge>
          )}
        </div>
        <ul className="space-y-3 flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className={`w-full mt-6 ${plan.popular ? '' : 'variant-outline'}`}
          variant={plan.popular ? "default" : "outline"}
          onClick={() => handleSubscribe(plan.key, plan.cta)}
          disabled={loadingPlan === plan.key}
        >
          {loadingPlan === plan.key ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            plan.cta
          )}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that's right for you. Upgrade anytime as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
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

        {/* Artists Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <Music className="h-3 w-3 mr-1" />
              For Artists
            </Badge>
            <h2 className="text-2xl font-bold">Build your audience, your way</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {artistPlans.map(plan => renderPlanCard(plan, <Music className="h-6 w-6 text-primary" />, "artist"))}
          </div>
        </section>

        {/* Fans Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <User className="h-3 w-3 mr-1" />
              For Fans
            </Badge>
            <h2 className="text-2xl font-bold">Get closer to the music you love</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {fanPlans.map(plan => renderPlanCard(plan, <User className="h-6 w-6 text-primary" />, "fan"))}
          </div>
        </section>

        {/* Brands Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <Building2 className="h-3 w-3 mr-1" />
              For Brands & Partners
            </Badge>
            <h2 className="text-2xl font-bold">Connect with authentic artists</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {brandPlans.map(plan => renderPlanCard(plan, <Building2 className="h-6 w-6 text-primary" />, "brand"))}
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
