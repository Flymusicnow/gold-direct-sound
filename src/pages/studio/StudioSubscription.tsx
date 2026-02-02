import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioLayout } from "@/components/layouts/StudioLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Star, DollarSign, Users, TrendingUp, Zap } from "lucide-react";
import { SUPPORTER_TIERS } from "@/config/supporterTiers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BetaCodeInput } from "@/components/artist/BetaCodeInput";
import { EarlyAccessBadge } from "@/components/artist/EarlyAccessBadge";
import { InviteFriendsCard } from "@/components/artist/InviteFriendsCard";
import { useMyPricingStatus } from "@/hooks/useMyPricingStatus";

import type { ArtistLevel } from '@/types/unlockLevels';

interface Supporter {
  id: string;
  tier: string;
  status: string;
  created_at: string;
  fan_user_id: string;
  fan: {
    full_name: string;
    email: string;
  };
}

interface TierDefinition {
  name: string;
  subtitle: string;
  price: number | null;
  period: string;
  description: string;
  features: string[];
  current?: boolean;
  unlockLevel: ArtistLevel;
  ctaText: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  mvpLabel?: string;
  comingSoon?: boolean;
}

const tiers: TierDefinition[] = [
  {
    name: "Free",
    subtitle: "Getting Started",
    price: null,
    period: "",
    description: "Essential tools to begin",
    features: [
      "Basic artist profile",
      "Limited track uploads",
      "Basic campaigns",
      "Discovery listing",
      "Basic stats"
    ],
    current: true,
    unlockLevel: 'artist_free',
    ctaText: "Current Plan",
    icon: Sparkles,
  },
  {
    name: "Trial Access",
    subtitle: "MVP",
    price: null,
    period: "",
    description: "Extended access during trial",
    features: [
      "Everything in Free",
      "Full analytics dashboard",
      "Community tools",
      "Campaign insights",
      "Extended uploads"
    ],
    unlockLevel: 'artist_trial',
    ctaText: "Included in trial (MVP)",
    icon: Star,
    highlight: true,
    mvpLabel: "Included in trial (MVP)"
  },
  {
    name: "Artist Pro",
    subtitle: "Post-MVP",
    price: null,
    period: "",
    description: "Premium features",
    features: [
      "Everything in Trial",
      "Advanced analytics",
      "Fan segmentation",
      "Campaign builder"
    ],
    unlockLevel: 'artist_pro',
    ctaText: "Pricing finalized post-MVP",
    icon: Crown,
    mvpLabel: "Pricing finalized post-MVP",
    comingSoon: true
  },
];

export default function StudioSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [badgeName, setBadgeName] = useState<string | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, lastPayout: null as string | null });
  const { pricingStatus, hasBetaAccess: hasPricingBetaAccess, discountPercent, expiresAt } = useMyPricingStatus();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      // Fetch supporters
      const { data: supportersData } = await supabase
        .from("supporter_subscriptions")
        .select("id, tier, status, created_at, fan_user_id")
        .eq("artist_id", profile.id)
        .eq("status", "active");

      if (supportersData) {
        const fanIds = supportersData.map((s) => s.fan_user_id);
        const { data: fanProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", fanIds);

        const supportersWithFans = supportersData.map((supporter) => {
          const fan = fanProfiles?.find((f) => f.id === supporter.fan_user_id);
          return { ...supporter, fan: { full_name: fan?.full_name || "Anonymous", email: fan?.email || "" } };
        });
        setSupporters(supportersWithFans);
      }

      // Fetch payouts
      const { data: payoutData } = await supabase
        .from("artist_payouts")
        .select("amount_due, amount_paid, last_payout_at")
        .eq("artist_user_id", user.id)
        .maybeSingle();

      if (payoutData) {
        setEarnings({ total: payoutData.amount_paid || 0, pending: payoutData.amount_due || 0, lastPayout: payoutData.last_payout_at });
      }

      await fetchBetaAccess();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBetaAccess = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from("artist_beta_access").select("badge_name").eq("user_id", user.id).maybeSingle();
      if (data) { setHasBetaAccess(true); setBadgeName(data.badge_name); }
    } catch (error) {
      console.error("Error fetching beta access:", error);
    }
  };

  const calculateMonthlyRevenue = () => {
    return supporters.reduce((total, supporter) => {
      const tierRevenue = supporter.tier === "gold" 
        ? SUPPORTER_TIERS.gold.price * 0.7
        : SUPPORTER_TIERS.basic.price * 0.7;
      return total + tierRevenue;
    }, 0);
  };

  if (loading) {
    return (
      <StudioLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Membership & Earnings</h1>
                <p className="text-sm text-muted-foreground">Manage supporters and track revenue</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPricingBetaAccess && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  Beta Access Active
                </Badge>
              )}
              {!hasPricingBetaAccess && discountPercent > 0 && (
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  {discountPercent}% Discount Applied
                </Badge>
              )}
              {hasBetaAccess && <EarlyAccessBadge />}
            </div>
          </div>

          {/* Earnings Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Active Supporters</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{supporters.length}</div><p className="text-xs text-muted-foreground mt-1">{supporters.filter(s=>s.tier==="gold").length} Gold, {supporters.filter(s=>s.tier==="basic").length} Basic</p></CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Monthly Revenue</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{calculateMonthlyRevenue().toFixed(2)} kr</div><p className="text-xs text-muted-foreground mt-1">70% of subscriptions</p></CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Pending Payout</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{earnings.pending.toFixed(2)} kr</div><p className="text-xs text-muted-foreground mt-1">{earnings.lastPayout ? `Last: ${new Date(earnings.lastPayout).toLocaleDateString()}` : "No payouts yet"}</p></CardContent>
            </Card>
          </div>

          {/* Supporters List */}
          {supporters.length > 0 && (
            <Card><CardHeader><CardTitle>Your Supporters</CardTitle><CardDescription>Fans currently supporting you</CardDescription></CardHeader>
            <CardContent><div className="space-y-3">
              {supporters.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary">{s.fan.full_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{s.fan.full_name}</p><p className="text-sm text-muted-foreground">{s.fan.email}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={s.tier==="gold"?"bg-primary/10 border-primary text-primary":""}>{s.tier==="gold"&&<Crown className="h-3 w-3 mr-1"/>}{s.tier==="gold"?"Gold":"Basic"} • {s.tier==="gold"?SUPPORTER_TIERS.gold.price:SUPPORTER_TIERS.basic.price} kr/mo</Badge>
                    <p className="text-xs text-muted-foreground">Since {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div></CardContent></Card>
          )}

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

          {/* Invite Friends Section */}
          <InviteFriendsCard />

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
                Trial Access (MVP)
              </h3>
              <p className="text-sm text-muted-foreground">
                Extended features available during your trial period. 
                Pricing and subscription tiers will be finalized post-MVP.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">No payment required</Badge>
                <Badge variant="outline">Extended feature access</Badge>
                <Badge variant="outline">Pricing finalized post-MVP</Badge>
              </div>
            </div>
          </Card>
        </div>
    </StudioLayout>
  );
}