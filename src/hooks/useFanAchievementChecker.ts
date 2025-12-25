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
    if (!user) {
      console.log("[Achievements] No user, skipping check");
      return [];
    }

    console.log("[Achievements] Checking achievements for user:", user.id);

    try {
      const { data, error } = await supabase.rpc("check_and_unlock_fan_achievements", {
        _fan_user_id: user.id,
      });

      console.log("[Achievements] RPC response:", { data, error });

      if (error) throw error;

      const newAchievements = (data as string[]) || [];
      console.log("[Achievements] New achievements to unlock:", newAchievements);

      // Celebrate each new achievement with staggered timing for visibility
      newAchievements.forEach((achievementKey, index) => {
        const achievement = ACHIEVEMENT_DEFINITIONS[achievementKey as keyof typeof ACHIEVEMENT_DEFINITIONS];
        if (achievement) {
          // Stagger notifications so they don't stack and disappear quickly
          setTimeout(() => {
            // Trigger confetti
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
            });

            // Show toast with longer duration
            toast.success(`🏆 Achievement Unlocked: ${achievement.name}`, {
              description: achievement.description,
              duration: 5000, // 5 seconds for better visibility
            });
          }, index * 1500); // 1.5 second delay between each
        }
      });

      return newAchievements;
    } catch (error) {
      console.error("[Achievements] Error checking achievements:", error);
      toast.error("Could not check achievements. Please try again.");
      return [];
    }
  };

  return { checkAndUnlockAchievements };
}
