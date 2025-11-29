import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementBadge } from "./AchievementBadge";
import { useAchievements } from "@/hooks/useAchievements";

export function ArtistAchievementsCard() {
  const { achievements, loading } = useAchievements();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading achievements...</p>
        </CardContent>
      </Card>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Achievements</CardTitle>
              <CardDescription>
                {unlockedCount} of {totalCount} unlocked
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-gold transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.type}
              icon={achievement.icon}
              name={achievement.name}
              description={achievement.description}
              unlocked={achievement.unlocked}
              unlockedAt={achievement.unlockedAt}
            />
          ))}
        </div>

        {unlockedCount === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Start uploading tracks and engaging with fans to unlock achievements!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
