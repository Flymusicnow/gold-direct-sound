import { Crown, Sparkles, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserTier } from "@/hooks/useUserSubscription";

interface PlanBadgeProps {
  tier: UserTier;
  className?: string;
  showIcon?: boolean;
}

const tierConfig: Record<UserTier, { label: string; icon: React.ReactNode; className: string }> = {
  free: {
    label: "Free",
    icon: null,
    className: "bg-muted text-muted-foreground"
  },
  pro: {
    label: "Pro",
    icon: <Zap className="h-3 w-3" />,
    className: "bg-primary/20 text-primary border-primary"
  },
  elite: {
    label: "Elite",
    icon: <Crown className="h-3 w-3" />,
    className: "bg-gradient-to-r from-primary/30 to-yellow-500/30 text-primary border-primary"
  },
  supporter: {
    label: "Supporter",
    icon: <Star className="h-3 w-3" />,
    className: "bg-primary/20 text-primary border-primary"
  },
  enterprise: {
    label: "Enterprise",
    icon: <Sparkles className="h-3 w-3" />,
    className: "bg-gradient-to-r from-primary/30 to-purple-500/30 text-primary border-primary"
  }
};

export const PlanBadge = ({ tier, className = "", showIcon = true }: PlanBadgeProps) => {
  const config = tierConfig[tier];
  
  if (tier === "free") return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
    >
      {showIcon && config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
};
