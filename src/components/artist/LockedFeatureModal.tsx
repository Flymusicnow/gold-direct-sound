import { useState } from "react";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BetaCodeInput } from "./BetaCodeInput";

interface LockedFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  featureDescription: string;
  tierRequired: "gold" | "pro";
  onSuccess?: () => void;
}

export function LockedFeatureModal({
  open,
  onOpenChange,
  featureName,
  featureDescription,
  tierRequired,
  onSuccess,
}: LockedFeatureModalProps) {
  const [showBetaInput, setShowBetaInput] = useState(false);

  const goldFeatures = [
    "Unlimited track uploads",
    "Unlimited video uploads",
    "Spotlight priority placement",
    "Advanced analytics dashboard",
    "Custom profile badge",
    "Priority support",
  ];

  const proFeatures = [
    ...goldFeatures,
    "Verified artist badge",
    "Featured placement",
    "Dedicated account manager",
    "Custom integrations",
    "White-label options",
    "API access",
  ];

  const features = tierRequired === "pro" ? proFeatures : goldFeatures;
  const tierName = tierRequired === "gold" ? "FlyMusic Gold" : "Artist Pro";
  const tierPrice = tierRequired === "gold" ? "$9.99/month" : "$29.99/month";

  const handleBetaSuccess = () => {
    setShowBetaInput(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-primary/20 bg-gradient-to-b from-background to-background/95">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
              <Lock className="h-6 w-6 text-background" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{featureName}</DialogTitle>
              <DialogDescription className="text-base">
                {featureDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tier Badge */}
          <div className="flex items-center justify-center">
            <Badge className="bg-gradient-gold border-0 text-background px-4 py-2 text-base">
              <Sparkles className="w-4 h-4 mr-2" />
              Requires {tierName}
            </Badge>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Included in {tierName}
            </h4>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-3xl font-bold">{tierPrice}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Launching soon – stay tuned!
            </p>
          </div>

          {/* Beta Code Input */}
          {showBetaInput ? (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <BetaCodeInput onSuccess={handleBetaSuccess} compact />
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full bg-gradient-gold hover:opacity-90 text-background"
                size="lg"
                disabled
              >
                Coming Soon
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/20"
                onClick={() => setShowBetaInput(true)}
              >
                I Have a Beta Code
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            As an early access user, you'll receive special lifetime discounts when we launch paid tiers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
