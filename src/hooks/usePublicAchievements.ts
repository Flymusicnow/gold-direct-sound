import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidUUID } from "@/lib/utils/validation";

export type AchievementType =
  | "first_track"
  | "first_video"
  | "first_follower"
  | "followers_10"
  | "followers_50"
  | "followers_100"
  | "plays_100"
  | "plays_1000"
  | "spotlight_entry"
  | "spotlight_top10";

interface Achievement {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, { name: string; description: string; icon: string }> = {
  first_track: {
    name: "First Release",
    description: "Upload your first track",
    icon: "🎵",
  },
  first_video: {
    name: "Video Creator",
    description: "Share your first video",
    icon: "🎬",
  },
  first_follower: {
    name: "Growing Fanbase",
    description: "Get your first follower",
    icon: "❤️",
  },
  followers_10: {
    name: "Community Builder",
    description: "Reach 10 followers",
    icon: "👥",
  },
  followers_50: {
    name: "Rising Star",
    description: "Reach 50 followers",
    icon: "⭐",
  },
  followers_100: {
    name: "Established Artist",
    description: "Reach 100 followers",
    icon: "🌟",
  },
  plays_100: {
    name: "Hundred Plays",
    description: "Get 100 total plays",
    icon: "🔥",
  },
  plays_1000: {
    name: "Thousand Plays",
    description: "Get 1,000 total plays",
    icon: "💎",
  },
  spotlight_entry: {
    name: "Spotlight Ready",
    description: "Submit your first Spotlight entry",
    icon: "✨",
  },
  spotlight_top10: {
    name: "Chart Climber",
    description: "Reach top 10 in Spotlight",
    icon: "🏆",
  },
};

export function usePublicAchievements(artistIdOrUserId: string | undefined) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate input before making requests
    if (!artistIdOrUserId || !isValidUUID(artistIdOrUserId)) {
      // Return empty achievements with all definitions (unlocked = false)
      const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(
        ([type, def]) => ({
          type: type as AchievementType,
          ...def,
          unlocked: false,
        })
      );
      setAchievements(allAchievements);
      setLoading(false);
      return;
    }

    resolveAndFetchAchievements();
  }, [artistIdOrUserId]);

  const resolveAndFetchAchievements = async () => {
    if (!artistIdOrUserId) return;

    try {
      // First, resolve the ID to get the correct user_id
      // The param could be either user_id or artist_profiles.id
      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("user_id")
        .or(`user_id.eq.${artistIdOrUserId},id.eq.${artistIdOrUserId}`)
        .maybeSingle();

      if (!profile) {
        // No profile found - return empty achievements
        const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(
          ([type, def]) => ({
            type: type as AchievementType,
            ...def,
            unlocked: false,
          })
        );
        setAchievements(allAchievements);
        setLoading(false);
        return;
      }

      const resolvedUserId = profile.user_id;

      // Now fetch achievements with the correct user_id
      const { data: unlockedData } = await supabase
        .from("artist_achievements")
        .select("achievement_type, unlocked_at")
        .eq("user_id", resolvedUserId);

      const unlockedMap = new Map(
        unlockedData?.map((a) => [a.achievement_type, a.unlocked_at]) || []
      );

      const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(
        ([type, def]) => ({
          type: type as AchievementType,
          ...def,
          unlocked: unlockedMap.has(type),
          unlockedAt: unlockedMap.get(type),
        })
      );

      setAchievements(allAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      // On error, return empty achievements
      const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(
        ([type, def]) => ({
          type: type as AchievementType,
          ...def,
          unlocked: false,
        })
      );
      setAchievements(allAchievements);
    } finally {
      setLoading(false);
    }
  };

  return {
    achievements,
    loading,
  };
}
