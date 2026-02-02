import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Crown, Check, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppConfig } from "@/hooks/useAppConfig";
import { isPaymentsEnabled } from "@/config/mvpConfig";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  requiredTier?: "pro" | "elite" | "supporter" | "enterprise" | null;
  userType?: "artist" | "fan" | "brand";
}

const planDetails = {
  artist: {
    pro: {
      name: "Artist Pro",
      price: 99,
      yearlyPrice: 990,
      icon: <Zap className="h-5 w-5" />,
      features: [
        "Unlimited track uploads",
        "Advanced analytics dashboard",
        "Priority Spotlight placement",
        "Promo OS smart links",
        "Presskit / EPK builder",
        "Collaboration requests",
        "Custom supporter tiers"
      ]
    },
    elite: {
      name: "Artist Elite",
      price: 249,
      yearlyPrice: 2490,
      icon: <Crown className="h-5 w-5" />,
      features: [
        "Everything in Pro",
        "AI-powered bio & content tools",
        "Brand collaboration matching",
        "Dedicated support",
        "Featured artist placement",
        "Revenue optimization tools",
        "White-label presskit"
      ]
    }
  },
  fan: {
    supporter: {
      name: "Supporter Pass",
      price: 49,
      yearlyPrice: 490,
      icon: <Zap className="h-5 w-5" />,
      features: [
        "2x XP multiplier",
        "Exclusive content access",
        "Early access to releases",
        "Supporter badge on profile",
        "Priority event access",
        "Ad-free experience"
      ]
    }
  },
  brand: {
    pro: {
      name: "Brand Pro",
      price: 999,
      yearlyPrice: 9990,
      icon: <Zap className="h-5 w-5" />,
      features: [
        "AI-powered match engine",
        "Unlimited artist contacts",
        "Campaign management",
        "Performance analytics",
        "Priority support"
      ]
    },
    enterprise: {
      name: "Brand Enterprise",
      price: null,
      yearlyPrice: null,
      icon: <Crown className="h-5 w-5" />,
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
        "Bulk licensing deals",
        "API access"
      ]
    }
  }
};

export const UpgradeModal = ({
  open,
  onOpenChange,
  featureName,
  requiredTier = "pro",
  userType = "artist"
}: UpgradeModalProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { config } = useAppConfig();
  
  // Check if payments are enabled
  const paymentsEnabled = isPaymentsEnabled(config);

  const getTargetPlan = () => {
    if (userType === "fan") {
      return planDetails.fan.supporter;
    }
    if (userType === "brand") {
      return requiredTier === "enterprise" 
        ? planDetails.brand.enterprise 
        : planDetails.brand.pro;
    }
    return requiredTier === "elite" 
      ? planDetails.artist.elite 
      : planDetails.artist.pro;
  };

  const getPlanKey = () => {
    if (userType === "fan") return "fan_supporter";
    if (userType === "brand") return requiredTier === "enterprise" ? "brand_enterprise" : "brand_pro";
    return requiredTier === "elite" ? "artist_elite" : "artist_pro";
  };

  const plan = getTargetPlan();
  const price = isYearly ? plan.yearlyPrice : plan.price;
  const savings = plan.price && plan.yearlyPrice 
    ? Math.round((1 - plan.yearlyPrice / (plan.price * 12)) * 100) 
    : 0;

  const handleUpgrade = async () => {
    const planKey = getPlanKey();
    
    // MVP: Block ALL payments via single flag
    if (!paymentsEnabled) {
      toast.info("Premium plans coming after MVP. Enjoy full access during your trial!");
      onOpenChange(false);
      return;
    }
    
    // Post-MVP: Normal checkout flow
    // For enterprise or plans without price, go to pricing page
    if (planKey === "brand_enterprise" || !price) {
      onOpenChange(false);
      navigate("/pricing");
      return;
    }

    setIsLoading(true);
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
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {plan.icon}
            </div>
            Upgrade to {plan.name}
          </DialogTitle>
          <DialogDescription>
            {featureName 
              ? `"${featureName}" requires ${plan.name} to unlock.`
              : `Unlock premium features with ${plan.name}.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price Display */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {price === null ? "Custom" : price === 0 ? "Free" : `${price} SEK`}
            </div>
            {price !== null && price > 0 && (
              <div className="text-sm text-muted-foreground">
                /{isYearly ? "year" : "month"}
              </div>
            )}
          </div>

          {/* Billing Toggle */}
          {plan.price !== null && plan.price > 0 && (
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span className={`text-sm ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
                {savings > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    Save {savings}%
                  </Badge>
                )}
              </span>
            </div>
          )}

          {/* Features */}
          <ul className="space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleUpgrade} 
              className="w-full" 
              disabled={isLoading || !paymentsEnabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : !paymentsEnabled ? (
                <>
                  <Badge variant="secondary" className="mr-2">Coming after MVP</Badge>
                  Available during trial
                </>
              ) : (
                <>
                  Upgrade Now
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/pricing")} className="w-full">
              View All Plans
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-muted-foreground">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
