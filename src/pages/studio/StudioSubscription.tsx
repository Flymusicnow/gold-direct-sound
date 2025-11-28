import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Star, Zap } from "lucide-react";
import { BetaCodeInput } from "@/components/artist/BetaCodeInput";
import { EarlyAccessBadge } from "@/components/artist/EarlyAccessBadge";

const tiers = [
  {
    name: "Free",
    subtitle: "Early Access",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Upload up to 5 tracks",
      "Upload up to 3 videos",
      "Basic analytics",
      "Artist profile",
      "Fan engagement tools",
      "Event management",
    ],
    current: true,
    comingSoon: false,
    ctaText: "Current Plan",
    icon: Sparkles,
  },
  {
    name: "FlyMusic Gold",
    subtitle: "Most Popular",
    price: "$9.99",
    period: "/month",
    description: "For serious independent artists",
    features: [
      "Everything in Free",
      "Unlimited track uploads",
      "Unlimited video uploads",
      "Spotlight priority placement",
      "Advanced analytics dashboard",
      "Custom profile badge",
      "Priority support",
    ],
    current: false,
    comingSoon: true,
    ctaText: "Coming Soon",
    icon: Star,
    highlight: true,
  },
  {
    name: "Artist Pro",
    subtitle: "Enterprise",
    price: "$29.99",
    period: "/month",
    description: "Maximum exposure and features",
    features: [
      "Everything in Gold",
      "Verified artist badge",
      "Featured placement",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "API access",
    ],
    current: false,
    comingSoon: true,
    ctaText: "Contact Sales",
    icon: Crown,
  },
];

export default function StudioSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [badgeName, setBadgeName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBetaAccess();
  }, [user, navigate]);

  const fetchBetaAccess = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("artist_beta_access")
        .select("badge_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setHasBetaAccess(true);
        setBadgeName(data.badge_name);
      }
    } catch (error) {
      console.error("Error fetching beta access:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen pt-16">
      <StudioSidebar />
      <MobileStudioNav />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Membership</h1>
                <p className="text-sm text-muted-foreground">Unlock your full potential</p>
              </div>
            </div>
            {hasBetaAccess && <EarlyAccessBadge />}
          </div>

          {/* Tier Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card
                  key={tier.name}
                  className={`relative ${
                    tier.highlight ? "border-primary/50 shadow-lg" : "border-border"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-gold border-0">
                        {tier.subtitle}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground text-sm">{tier.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      disabled={tier.current || tier.comingSoon}
                      className={`w-full ${
                        tier.highlight && !tier.comingSoon
                          ? "bg-gradient-gold hover:opacity-90"
                          : ""
                      }`}
                      variant={tier.current ? "outline" : "default"}
                    >
                      {tier.current && <Check className="mr-2 h-4 w-4" />}
                      {tier.ctaText}
                    </Button>

                    {tier.comingSoon && (
                      <p className="text-xs text-center text-muted-foreground">
                        Launching soon – stay tuned!
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Beta Code Redemption */}
          {!hasBetaAccess && (
            <Card className="p-6 border-primary/20 bg-primary/5">
              <BetaCodeInput onSuccess={fetchBetaAccess} />
            </Card>
          )}

          {/* Info Section */}
          <Card className="p-6 bg-muted/50">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Early Access Benefits
              </h3>
              <p className="text-sm text-muted-foreground">
                As an early access user, you're getting all the premium features for free while
                we perfect the platform. When we launch paid tiers, early supporters will receive
                special lifetime discounts and exclusive perks.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">No payment required</Badge>
                <Badge variant="outline">Full feature access</Badge>
                <Badge variant="outline">Lifetime discounts coming</Badge>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}