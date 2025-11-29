import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LockedContentOverlayProps {
  requiredTier: "basic" | "gold";
  onUnlock: () => void;
}

export const LockedContentOverlay = ({ requiredTier, onUnlock }: LockedContentOverlayProps) => {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 rounded-lg">
      <div className="flex items-center gap-2">
        <Lock className="h-8 w-8 text-primary" />
        {requiredTier === "gold" && <Crown className="h-6 w-6 text-primary" />}
      </div>
      
      <Badge 
        variant="outline" 
        className="bg-primary/20 border-primary text-primary px-4 py-1"
      >
        {requiredTier === "gold" ? "👑 Gold Exclusive" : "Supporter Only"}
      </Badge>
      
      <div className="text-center px-4">
        <p className="text-white font-semibold mb-1">
          {requiredTier === "gold" ? "Gold Supporters Only" : "Supporters Only"}
        </p>
        <p className="text-sm text-muted-foreground">
          Become a supporter to unlock this content
        </p>
      </div>
      
      <Button
        onClick={onUnlock}
        className="bg-gradient-gold hover:opacity-90"
      >
        Become a Supporter
      </Button>
    </div>
  );
};
