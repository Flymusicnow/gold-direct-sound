import { Crown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupporterExclusiveBadgeProps {
  tier: "basic" | "gold";
  className?: string;
}

export const SupporterExclusiveBadge = ({ tier, className = "" }: SupporterExclusiveBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={`bg-primary/10 border-primary text-primary flex items-center gap-1 ${className}`}
    >
      {tier === "gold" ? (
        <>
          <Crown className="h-3 w-3" />
          Gold Exclusive
        </>
      ) : (
        <>
          <Lock className="h-3 w-3" />
          Supporter Only
        </>
      )}
    </Badge>
  );
};
