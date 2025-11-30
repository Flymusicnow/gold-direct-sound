import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const ACHIEVEMENT_DEFINITIONS = {
  first_follow: {
    name: "First Step",
    description: "Follow your first artist",
    icon: "👤",
  },
  first_vote: {
    name: "Spotlight Voter",
    description: "Cast your first Spotlight vote",
    icon: "⭐",
  },
  first_stack: {
    name: "Stack Creator",
    description: "Create your first Stack",
    icon: "📚",
  },
  first_comment: {
    name: "Voice Heard",
    description: "Leave your first comment",
    icon: "💬",
  },
  likes_10: {
    name: "Music Lover",
    description: "Like 10 tracks",
    icon: "❤️",
  },
  bronze_supporter: {
    name: "Bronze Supporter",
    description: "Reach Bronze Supporter tier",
    icon: "🏆",
  },
  active_supporter: {
    name: "Active Supporter",
    description: "Reach 50 XP total",
    icon: "🎯",
  },
  true_believer: {
    name: "True Believer",
    description: "Reach 150 XP total",
    icon: "💎",
  },
  comment_voice: {
    name: "Comment Voice",
    description: "Leave 5 comments",
    icon: "💬",
  },
};

export function useFanAchievementChecker() {
  const { user } = useAuth();

  const checkAndUnlockAchievements = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc("check_and_unlock_fan_achievements", {
        _fan_user_id: user.id,
      });

      if (error) throw error;

      const newAchievements = data as string[];

      // Celebrate each new achievement
      newAchievements.forEach((achievementKey) => {
        const achievement = ACHIEVEMENT_DEFINITIONS[achievementKey as keyof typeof ACHIEVEMENT_DEFINITIONS];
        if (achievement) {
          // Trigger confetti
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
          });

          // Show toast
          toast.success(`🏆 Achievement Unlocked: ${achievement.name}`, {
            description: achievement.description,
          });
        }
      });

      return newAchievements;
    } catch (error) {
      console.error("Error checking achievements:", error);
      return [];
    }
  };

  return { checkAndUnlockAchievements };
}
