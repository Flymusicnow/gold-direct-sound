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
  | "active_supporter"
  | "true_believer"
  | "comment_voice";

export interface FanAchievement {
  type: FanAchievementType;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const FAN_ACHIEVEMENT_DEFINITIONS: Record<FanAchievementType, { name: string; description: string; icon: string }> = {
  first_follow: {
    name: "First Step",
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

// Level thresholds
const LEVEL_THRESHOLDS = {
  bronze: 10,
  silver: 50,
  gold: 150,
};

export function useFanAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<FanAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [supporterLevel, setSupporterLevel] = useState<'none' | 'bronze' | 'silver' | 'gold'>('none');

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      // Fetch unlocked achievements from database
      const { data: unlockedData } = await supabase
        .from("fan_achievements")
        .select("achievement_key, unlocked_at")
        .eq("fan_user_id", user.id);

      const unlockedKeys = new Set(unlockedData?.map((a) => a.achievement_key) || []);
      const unlockedMap = new Map(unlockedData?.map((a) => [a.achievement_key, a.unlocked_at]) || []);

      // Calculate total XP and supporter level
      const { data: supportScores } = await supabase
        .from("fan_support_scores")
        .select("score, level")
        .eq("fan_user_id", user.id);

      const total = supportScores?.reduce((sum, s) => sum + Number(s.score), 0) || 0;
      setTotalXP(total);

      // Determine highest supporter level
      const levels = supportScores?.map(s => s.level) || [];
      if (levels.includes('gold')) setSupporterLevel('gold');
      else if (levels.includes('silver')) setSupporterLevel('silver');
      else if (levels.includes('bronze')) setSupporterLevel('bronze');
      else setSupporterLevel('none');

      // Build achievement list
      const achievementsList: FanAchievement[] = Object.entries(FAN_ACHIEVEMENT_DEFINITIONS).map(
        ([key, def]) => ({
          type: key as FanAchievementType,
          ...def,
          unlocked: unlockedKeys.has(key),
          unlockedAt: unlockedMap.get(key),
        })
      );

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

  // Calculate progress to next level
  const nextLevelXP = supporterLevel === 'gold' 
    ? 0 
    : supporterLevel === 'silver' 
    ? LEVEL_THRESHOLDS.gold - totalXP 
    : supporterLevel === 'bronze'
    ? LEVEL_THRESHOLDS.silver - totalXP
    : LEVEL_THRESHOLDS.bronze - totalXP;

  const progressToNextLevel = supporterLevel === 'gold'
    ? 100
    : supporterLevel === 'silver'
    ? (totalXP / LEVEL_THRESHOLDS.gold) * 100
    : supporterLevel === 'bronze'
    ? (totalXP / LEVEL_THRESHOLDS.silver) * 100
    : (totalXP / LEVEL_THRESHOLDS.bronze) * 100;

  return { 
    achievements, 
    loading, 
    refetch,
    totalXP,
    supporterLevel,
    nextLevelXP,
    progressToNextLevel,
  };
}
