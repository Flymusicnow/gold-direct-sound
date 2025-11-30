import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock } from "lucide-react";
import { useFanAchievements } from "@/hooks/useFanAchievements";
import { cn } from "@/lib/utils";

export function FanAchievementsCard() {
  const { achievements, loading } = useFanAchievements();

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading achievements...</p>
      </Card>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Your Fan Journey</h2>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.type}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg border text-center transition-all",
              achievement.unlocked
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/30"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2",
                achievement.unlocked
                  ? "bg-gradient-gold shadow-gold"
                  : "bg-muted relative"
              )}
            >
              {achievement.unlocked ? (
                achievement.icon
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <h3
              className={cn(
                "text-xs font-semibold mb-1",
                achievement.unlocked ? "text-primary" : "text-muted-foreground"
              )}
            >
              {achievement.name}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {achievement.description}
            </p>
          </div>
        ))}
      </div>

      {unlockedCount === 0 && (
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Start discovering artists and engaging with music to unlock achievements!
          </p>
        </div>
      )}
    </Card>
  );
}
