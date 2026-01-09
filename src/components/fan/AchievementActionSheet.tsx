import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FanAchievement, FanAchievementType } from "@/hooks/useFanAchievements";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";

interface AchievementActionSheetProps {
  achievement: FanAchievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Action metadata for each achievement type
const ACHIEVEMENT_ACTIONS: Record<FanAchievementType, {
  howTo: string;
  actionPath: string;
  actionLabel: string;
}> = {
  first_follow: {
    howTo: "Browse artists and tap Follow on any profile",
    actionPath: "/fan/feed",
    actionLabel: "Browse Artists"
  },
  first_vote: {
    howTo: "Visit an active Spotlight campaign and vote for an artist",
    actionPath: "/spotlight/leaderboard",
    actionLabel: "Vote in Spotlight"
  },
  first_stack: {
    howTo: "Create a playlist of your favorite tracks",
    actionPath: "/fan/playlists",
    actionLabel: "Create Your Stack"
  },
  first_comment: {
    howTo: "Join an artist's community and share your thoughts",
    actionPath: "/fan/feed",
    actionLabel: "Find a Community"
  },
  likes_10: {
    howTo: "Like tracks you enjoy while browsing",
    actionPath: "/fan/feed",
    actionLabel: "Discover Music"
  },
  bronze_supporter: {
    howTo: "Keep engaging with artists to earn XP",
    actionPath: "/fan/supporter",
    actionLabel: "View Progress"
  },
  active_supporter: {
    howTo: "Reach 50 XP by supporting artists",
    actionPath: "/fan/supporter",
    actionLabel: "View Progress"
  },
  true_believer: {
    howTo: "Reach 150 XP by supporting artists",
    actionPath: "/fan/supporter",
    actionLabel: "View Progress"
  },
  comment_voice: {
    howTo: "Leave 5 comments in artist communities",
    actionPath: "/fan/feed",
    actionLabel: "Find Communities"
  },
};

export function AchievementActionSheet({ 
  achievement, 
  open, 
  onOpenChange 
}: AchievementActionSheetProps) {
  const navigate = useNavigate();
  const actionData = ACHIEVEMENT_ACTIONS[achievement.type];

  const handleGoToAction = () => {
    onOpenChange(false);
    navigate(actionData.actionPath);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
    });
  };

  // Trigger confetti when viewing an unlocked achievement
  if (open && achievement.unlocked) {
    setTimeout(() => triggerConfetti(), 100);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">{achievement.name}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 pb-safe">
          {/* Achievement Header */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
              achievement.unlocked 
                ? "bg-gradient-gold shadow-gold" 
                : "bg-muted/50"
            }`}>
              {achievement.unlocked ? achievement.icon : "🔒"}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                achievement.unlocked ? "text-primary" : "text-foreground"
              }`}>
                {achievement.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {achievement.description}
              </p>
            </div>
            {achievement.unlocked && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
          </div>

          {/* How To Section */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-1">How to complete</p>
            <p className="text-sm text-muted-foreground">
              {actionData.howTo}
            </p>
          </div>

          {/* Unlock Date or Action Button */}
          {achievement.unlocked && achievement.unlockedAt ? (
            <div className="text-center">
              <p className="text-sm text-primary/70">
                Unlocked {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
              </p>
            </div>
          ) : (
            <Button onClick={handleGoToAction} className="w-full">
              {actionData.actionLabel}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
