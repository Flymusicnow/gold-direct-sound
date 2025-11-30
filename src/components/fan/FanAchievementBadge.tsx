import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { FanAchievement } from "@/hooks/useFanAchievements";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FanAchievementBadgeProps {
  achievement: FanAchievement;
}

export function FanAchievementBadge({ achievement }: FanAchievementBadgeProps) {
  const { unlocked, name, description, icon, unlockedAt } = achievement;

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-300 relative overflow-hidden group",
        unlocked
          ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 shadow-gold hover:shadow-gold-lg"
          : "bg-card/20 backdrop-blur border-border/30 opacity-60"
      )}
    >
      <div className="space-y-3">
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl",
            unlocked
              ? "bg-gradient-gold shadow-gold"
              : "bg-muted/50 grayscale"
          )}
        >
          {unlocked ? icon : <Lock className="h-6 w-6 text-muted-foreground" />}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-sm font-semibold text-center",
            unlocked ? "text-primary" : "text-muted-foreground"
          )}
        >
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center line-clamp-2">
          {description}
        </p>

        {/* Unlock Date or Lock Message */}
        {unlocked && unlockedAt ? (
          <p className="text-xs text-primary/70 text-center">
            Unlocked {format(new Date(unlockedAt), "MMM d, yyyy")}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 text-center">
            Keep supporting to unlock
          </p>
        )}
      </div>

      {/* Gold shimmer effect on unlocked */}
      {unlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </Card>
  );
}
