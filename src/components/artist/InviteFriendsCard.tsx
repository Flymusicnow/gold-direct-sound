import { useEffect, useState } from "react";
import { Copy, Users, Award, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ReferralStats {
  code: string;
  totalUses: number;
  bonusTier: string | null;
}

export function InviteFriendsCard() {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const fetchReferralStats = async () => {
    if (!user) return;

    try {
      // Fetch referral code
      const { data: codeData } = await supabase
        .from("artist_referral_codes")
        .select("code, current_uses")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      // Fetch beta access for bonus tier
      const { data: betaData } = await supabase
        .from("artist_beta_access")
        .select("referral_bonus_tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (codeData) {
        setReferralStats({
          code: codeData.code,
          totalUses: codeData.current_uses || 0,
          bonusTier: betaData?.referral_bonus_tier || null,
        });
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc("generate_artist_referral_code", {
        _user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Referral code generated!",
        description: "Share your code to invite other artists.",
      });

      await fetchReferralStats();
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Error",
        description: "Failed to generate referral code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (referralStats?.code) {
      navigator.clipboard.writeText(referralStats.code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard.",
      });
    }
  };

  const getTierInfo = (tier: string | null) => {
    switch (tier) {
      case "ambassador":
        return { label: "Ambassador", color: "bg-gradient-gold", icon: Award };
      case "talent_scout":
        return { label: "Talent Scout", color: "bg-primary/20", icon: Users };
      case "community_builder":
        return { label: "Community Builder", color: "bg-muted", icon: CheckCircle2 };
      default:
        return null;
    }
  };

  const tierInfo = referralStats?.bonusTier ? getTierInfo(referralStats.bonusTier) : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!referralStats) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Invite Friends</CardTitle>
              <CardDescription>Earn bonus perks by inviting artists</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate your unique referral code to invite other artists to FlyMusic and unlock exclusive benefits.
          </p>
          <Button onClick={generateReferralCode} disabled={generating} className="w-full">
            {generating ? "Generating..." : "Generate My Referral Code"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Invite Friends</CardTitle>
              <CardDescription>Share your referral code</CardDescription>
            </div>
          </div>
          {tierInfo && (
            <Badge className={`${tierInfo.color} border-0`}>
              <tierInfo.icon className="w-3 h-3 mr-1" />
              {tierInfo.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Referral Code</p>
          <div className="flex items-center justify-between">
            <code className="text-xl font-bold tracking-wider text-primary">{referralStats.code}</code>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Artists Invited</p>
            <p className="text-2xl font-bold text-primary">{referralStats.totalUses}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Next Milestone</p>
            <p className="text-2xl font-bold">
              {referralStats.totalUses >= 10 ? "✓" : referralStats.totalUses >= 5 ? "10" : referralStats.totalUses >= 1 ? "5" : "1"}
            </p>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Reward Tiers</p>
          <div className="space-y-2">
            <div className={`flex items-center justify-between p-2 rounded ${referralStats.totalUses >= 1 ? "bg-muted" : "opacity-50"}`}>
              <span className="text-sm">Community Builder</span>
              <span className="text-xs text-muted-foreground">1+ referrals</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${referralStats.totalUses >= 5 ? "bg-muted" : "opacity-50"}`}>
              <span className="text-sm">Talent Scout</span>
              <span className="text-xs text-muted-foreground">5+ referrals</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${referralStats.totalUses >= 10 ? "bg-gradient-gold text-background" : "opacity-50"}`}>
              <span className="text-sm font-medium">Ambassador</span>
              <span className="text-xs">10+ referrals</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Share your code with fellow artists. When they sign up and create their profile, you'll unlock exclusive perks!
        </p>
      </CardContent>
    </Card>
  );
}
