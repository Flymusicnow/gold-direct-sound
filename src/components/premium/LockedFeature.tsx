import { useState, ReactNode } from "react";
import { Lock, Zap } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeModal } from "./UpgradeModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface LockedFeatureProps {
  featureKey: string;
  featureName?: string;
  children: ReactNode;
  userType?: "artist" | "fan" | "brand";
  fallback?: ReactNode;
  blurContent?: boolean;
}

export const LockedFeature = ({
  featureKey,
  featureName,
  children,
  userType = "artist",
  fallback,
  blurContent = true
}: LockedFeatureProps) => {
  const { allowed, reason, requiredTier, isLoading } = useFeatureAccess(featureKey);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (allowed) {
    return <>{children}</>;
  }

  // Custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state with blur overlay
  return (
    <>
      <div className="relative">
        {blurContent && (
          <div className="pointer-events-none select-none filter blur-sm opacity-50">
            {children}
          </div>
        )}
        <div 
          className={`${blurContent ? 'absolute inset-0' : ''} flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg p-6 cursor-pointer`}
          onClick={() => setShowUpgradeModal(true)}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {featureName || "Premium Feature"}
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {reason === 'not_logged_in' 
              ? "Sign in to access this feature"
              : `Upgrade to ${requiredTier === 'elite' ? 'Elite' : 'Pro'} to unlock`
            }
          </p>
          <Button onClick={() => setShowUpgradeModal(true)}>
            <Zap className="mr-2 h-4 w-4" />
            {reason === 'not_logged_in' ? 'Sign In' : 'Upgrade Now'}
          </Button>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureName={featureName}
        requiredTier={requiredTier}
        userType={userType}
      />
    </>
  );
};

// Simple wrapper for inline upgrade prompts
interface UpgradePromptProps {
  featureName: string;
  requiredTier?: "pro" | "elite" | "supporter" | "enterprise";
  userType?: "artist" | "fan" | "brand";
  compact?: boolean;
}

export const UpgradePrompt = ({
  featureName,
  requiredTier = "pro",
  userType = "artist",
  compact = false
}: UpgradePromptProps) => {
  const [showModal, setShowModal] = useState(false);

  if (compact) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
          <Lock className="mr-2 h-3 w-3" />
          Unlock
        </Button>
        <UpgradeModal
          open={showModal}
          onOpenChange={setShowModal}
          featureName={featureName}
          requiredTier={requiredTier}
          userType={userType}
        />
      </>
    );
  }

  return (
    <>
      <div 
        className="border border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setShowModal(true)}
      >
        <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
        <h4 className="font-medium mb-1">{featureName}</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Requires {requiredTier === 'elite' ? 'Elite' : 'Pro'} plan
        </p>
        <Button size="sm">
          <Zap className="mr-2 h-3 w-3" />
          Upgrade
        </Button>
      </div>
      <UpgradeModal
        open={showModal}
        onOpenChange={setShowModal}
        featureName={featureName}
        requiredTier={requiredTier}
        userType={userType}
      />
    </>
  );
};
