import { Badge } from "@/components/ui/badge";
import { Flame, Check, Zap } from "lucide-react";
import { useVotingStreak } from "@/hooks/useVotingStreak";
import { Skeleton } from "@/components/ui/skeleton";

export default function VotingStreakBadge() {
  const { currentStreak, votedThisWeek, isLoading } = useVotingStreak();

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  // No streak and no vote this week
  if (currentStreak === 0 && !votedThisWeek) {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
        <Zap className="h-3 w-3" />
        Vote to start a streak!
      </Badge>
    );
  }

  // Voted this week but no multi-week streak yet
  if (currentStreak === 1 || (votedThisWeek && currentStreak === 0)) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Check className="h-3 w-3 text-green-500" />
        Voted this week
      </Badge>
    );
  }

  // Multi-week streak
  const flameCount = Math.min(currentStreak - 1, 3); // Max 3 flames for 4+ week streaks
  
  return (
    <Badge 
      variant="default" 
      className="text-xs gap-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
    >
      {Array.from({ length: flameCount }).map((_, i) => (
        <Flame key={i} className="h-3 w-3" />
      ))}
      {currentStreak}-week streak
    </Badge>
  );
}
