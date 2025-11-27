import { Medal, Award, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpotlightSupporterBadgeProps {
  tier: string;
  totalVotes: number;
  variant?: "full" | "compact";
}

const tierConfig = {
  bronze: {
    icon: Medal,
    color: "text-orange-600",
    bgColor: "bg-orange-600/10",
    borderColor: "border-orange-600/20",
    label: "Bronze Supporter",
  },
  silver: {
    icon: Award,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/20",
    label: "Silver Supporter",
  },
  gold: {
    icon: Trophy,
    color: "text-[#E8BF1A]",
    bgColor: "bg-[#E8BF1A]/10",
    borderColor: "border-[#E8BF1A]/20",
    label: "Gold Supporter",
  },
};

export default function SpotlightSupporterBadge({
  tier,
  totalVotes,
  variant = "full",
}: SpotlightSupporterBadgeProps) {
  if (tier === "none") return null;

  const config = tierConfig[tier as keyof typeof tierConfig];
  if (!config) return null;

  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className={`p-3 rounded-full ${config.bgColor}`}>
        <Icon className={`h-6 w-6 ${config.color}`} />
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${config.color}`}>{config.label}</p>
        <p className="text-sm text-muted-foreground">{totalVotes} total votes</p>
      </div>
    </div>
  );
}
