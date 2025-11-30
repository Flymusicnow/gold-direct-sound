import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

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

export function useAchievements() {
  const { user, hasRole } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch for users with artist role
    if (user && hasRole('artist')) {
      fetchAchievements();
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data: unlockedData } = await supabase
        .from("artist_achievements")
        .select("achievement_type, unlocked_at")
        .eq("user_id", user.id);

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
    } finally {
      setLoading(false);
    }
  };

  const unlockAchievement = async (type: AchievementType, metadata?: Record<string, any>) => {
    if (!user) return;

    try {
      // Check if already unlocked
      const existing = achievements.find((a) => a.type === type && a.unlocked);
      if (existing) return;

      // Insert achievement
      const { error } = await supabase
        .from("artist_achievements")
        .insert({
          user_id: user.id,
          achievement_type: type,
          metadata: metadata || {},
        });

      if (error && error.code !== "23505") {
        // Ignore unique constraint errors
        throw error;
      }

      // Celebration
      const achievement = ACHIEVEMENT_DEFINITIONS[type];
      
      // Gold confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
      });

      // Toast notification
      toast({
        title: `🎉 Achievement Unlocked!`,
        description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
        duration: 5000,
      });

      // Refresh achievements
      await fetchAchievements();
    } catch (error) {
      console.error("Error unlocking achievement:", error);
    }
  };

  const checkAndUnlockAchievements = async () => {
    if (!user) return;

    try {
      // Fetch artist profile
      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return;

      // Check track-related achievements
      const { count: trackCount } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", profile.id);

      if (trackCount && trackCount >= 1) {
        await unlockAchievement("first_track");
      }

      // Check video-related achievements
      const { count: videoCount } = await supabase
        .from("artist_video_posts")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", profile.id);

      if (videoCount && videoCount >= 1) {
        await unlockAchievement("first_video");
      }

      // Check follower-related achievements
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", profile.id);

      if (followerCount) {
        if (followerCount >= 1) await unlockAchievement("first_follower");
        if (followerCount >= 10) await unlockAchievement("followers_10");
        if (followerCount >= 50) await unlockAchievement("followers_50");
        if (followerCount >= 100) await unlockAchievement("followers_100");
      }

      // Check play count achievements
      const { data: tracks } = await supabase
        .from("tracks")
        .select("play_count")
        .eq("artist_id", profile.id);

      const totalPlays = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      if (totalPlays >= 100) await unlockAchievement("plays_100");
      if (totalPlays >= 1000) await unlockAchievement("plays_1000");

      // Check spotlight achievements
      const { count: spotlightCount } = await supabase
        .from("spotlight_entries")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", profile.id)
        .eq("status", "approved");

      if (spotlightCount && spotlightCount >= 1) {
        await unlockAchievement("spotlight_entry");
      }

      // Check top 10 spotlight
      const { data: topEntry } = await supabase
        .from("spotlight_entries")
        .select("cached_rank")
        .eq("artist_id", profile.id)
        .eq("status", "approved")
        .lte("cached_rank", 10)
        .maybeSingle();

      if (topEntry) {
        await unlockAchievement("spotlight_top10");
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  return {
    achievements,
    loading,
    unlockAchievement,
    checkAndUnlockAchievements,
    refetch: fetchAchievements,
  };
}
