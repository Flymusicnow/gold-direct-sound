import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FanAchievementType =
  | "first_follow"
  | "first_vote"
  | "first_stack"
  | "first_comment"
  | "likes_10"
  | "bronze_supporter"
  | "streak_7"
  | "plays_50";

export interface FanAchievement {
  type: FanAchievementType;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const FAN_ACHIEVEMENT_DEFINITIONS: Record<FanAchievementType, { name: string; description: string; icon: string }> = {
  first_follow: {
    name: "First Follow",
    description: "Follow your first artist",
    icon: "👤",
  },
  first_vote: {
    name: "Spotlight Voter",
    description: "Vote in Spotlight",
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
  streak_7: {
    name: "Dedicated Fan",
    description: "7-day active streak",
    icon: "🔥",
  },
  plays_50: {
    name: "Playlist Master",
    description: "Play 50 tracks",
    icon: "🎵",
  },
};

export function useFanAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<FanAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      // Check first follow
      const { count: followCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("fan_id", user.id);

      // Check first vote
      const { count: voteCount } = await supabase
        .from("spotlight_votes")
        .select("*", { count: "exact", head: true })
        .eq("fan_user_id", user.id);

      // Check first stack
      const { count: stackCount } = await supabase
        .from("playlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Check first comment
      const { count: commentCount } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Check likes count
      const { count: likeCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Check bronze supporter
      const { data: supportScores } = await supabase
        .from("fan_support_scores")
        .select("level")
        .eq("fan_user_id", user.id)
        .in("level", ["bronze", "silver", "gold"]);

      const achievementsList: FanAchievement[] = [
        {
          type: "first_follow",
          ...FAN_ACHIEVEMENT_DEFINITIONS.first_follow,
          unlocked: (followCount || 0) > 0,
        },
        {
          type: "first_vote",
          ...FAN_ACHIEVEMENT_DEFINITIONS.first_vote,
          unlocked: (voteCount || 0) > 0,
        },
        {
          type: "first_stack",
          ...FAN_ACHIEVEMENT_DEFINITIONS.first_stack,
          unlocked: (stackCount || 0) > 0,
        },
        {
          type: "first_comment",
          ...FAN_ACHIEVEMENT_DEFINITIONS.first_comment,
          unlocked: (commentCount || 0) > 0,
        },
        {
          type: "likes_10",
          ...FAN_ACHIEVEMENT_DEFINITIONS.likes_10,
          unlocked: (likeCount || 0) >= 10,
        },
        {
          type: "bronze_supporter",
          ...FAN_ACHIEVEMENT_DEFINITIONS.bronze_supporter,
          unlocked: (supportScores?.length || 0) > 0,
        },
        {
          type: "streak_7",
          ...FAN_ACHIEVEMENT_DEFINITIONS.streak_7,
          unlocked: false, // Placeholder for future
        },
        {
          type: "plays_50",
          ...FAN_ACHIEVEMENT_DEFINITIONS.plays_50,
          unlocked: false, // Placeholder for future
        },
      ];

      setAchievements(achievementsList);
    } catch (error) {
      console.error("Error fetching fan achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchAchievements();
  };

  return { achievements, loading, refetch };
}
