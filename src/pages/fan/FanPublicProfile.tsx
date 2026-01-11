import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trophy, Star, Users, Heart } from "lucide-react";
import { format } from "date-fns";
import { FanAchievementBadge } from "@/components/fan/FanAchievementBadge";
import { FanAchievement, FanAchievementType } from "@/hooks/useFanAchievements";

const FAN_ACHIEVEMENT_DEFINITIONS: Record<FanAchievementType, { name: string; description: string; icon: string }> = {
  first_follow: { name: "First Step", description: "Follow your first artist", icon: "👤" },
  first_vote: { name: "Spotlight Voter", description: "Vote in Spotlight", icon: "⭐" },
  first_stack: { name: "Stack Creator", description: "Create your first Stack", icon: "📚" },
  first_comment: { name: "Voice Heard", description: "Leave your first comment", icon: "💬" },
  likes_10: { name: "Music Lover", description: "Like 10 tracks", icon: "❤️" },
  bronze_supporter: { name: "Bronze Supporter", description: "Reach Bronze Supporter tier", icon: "🏆" },
  active_supporter: { name: "Active Supporter", description: "Reach 50 XP total", icon: "🎯" },
  true_believer: { name: "True Believer", description: "Reach 150 XP total", icon: "💎" },
  comment_voice: { name: "Comment Voice", description: "Leave 5 comments", icon: "💬" },
};

interface FanProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface FanStats {
  achievementCount: number;
  totalXP: number;
  supporterLevel: 'none' | 'bronze' | 'silver' | 'gold';
  artistsFollowed: number;
  entriesSupported: number;
}

export default function FanPublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [stats, setStats] = useState<FanStats | null>(null);
  const [achievements, setAchievements] = useState<FanAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        // Use public_profiles view with maybeSingle() for graceful null handling
        const { data: profileData, error } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url, bio, created_at')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        // Set profile (null triggers "Profile not found" UI)
        setProfile(profileData);

        // Fetch achievements
        const { data: achievementData } = await supabase
          .from('fan_achievements')
          .select('achievement_key, unlocked_at')
          .eq('fan_user_id', userId);

        const unlockedKeys = new Set(achievementData?.map(a => a.achievement_key) || []);
        const unlockedMap = new Map(achievementData?.map(a => [a.achievement_key, a.unlocked_at]) || []);

        const achievementsList: FanAchievement[] = Object.entries(FAN_ACHIEVEMENT_DEFINITIONS)
          .filter(([key]) => unlockedKeys.has(key))
          .map(([key, def]) => ({
            type: key as FanAchievementType,
            ...def,
            unlocked: true,
            unlockedAt: unlockedMap.get(key),
          }));

        setAchievements(achievementsList);

        // Fetch stats
        const { data: supportScores } = await supabase
          .from('fan_support_scores')
          .select('score, level')
          .eq('fan_user_id', userId);

        const totalXP = supportScores?.reduce((sum, s) => sum + Number(s.score), 0) || 0;
        const levels = supportScores?.map(s => s.level) || [];
        
        let supporterLevel: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
        if (levels.includes('gold')) supporterLevel = 'gold';
        else if (levels.includes('silver')) supporterLevel = 'silver';
        else if (levels.includes('bronze')) supporterLevel = 'bronze';

        // Fetch following count - use RPC or skip if table doesn't exist
        let followCount = 0;
        try {
          const { count } = await supabase
            .from('follows' as any)
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);
          followCount = count || 0;
        } catch {
          // Table may not exist, continue without follow count
        }

        // Fetch supported entries count
        let supportedCount = 0;
        try {
          const { count } = await supabase
            .from('spotlight_votes')
            .select('*', { count: 'exact', head: true })
            .eq('fan_user_id', userId);
          supportedCount = count || 0;
        } catch {
          // Continue without supported count
        }

        setStats({
          achievementCount: achievementData?.length || 0,
          totalXP,
          supporterLevel,
          artistsFollowed: followCount || 0,
          entriesSupported: supportedCount,
        });
      } catch (error) {
        console.error('Error fetching fan profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-center text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const levelColors = {
    none: 'bg-muted text-muted-foreground',
    bronze: 'bg-amber-900/30 text-amber-500 border-amber-500/30',
    silver: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
    gold: 'bg-primary/20 text-primary border-primary/30',
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary/30">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.[0]?.toUpperCase() || "F"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.full_name || "Fan"}</h1>
              {stats && stats.supporterLevel !== 'none' && (
                <Badge className={`mt-1 ${levelColors[stats.supporterLevel]}`}>
                  {stats.supporterLevel.toUpperCase()} SUPPORTER
                </Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </p>
            </div>
          </div>
          
          {profile.bio && (
            <p className="mt-4 text-muted-foreground">{profile.bio}</p>
          )}
        </Card>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats.achievementCount}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </Card>
            <Card className="p-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalXP}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.artistsFollowed}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </Card>
            <Card 
              className="p-4 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/fan/${userId}/votes`)}
            >
              <Heart className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats.entriesSupported}</p>
              <p className="text-xs text-muted-foreground">Supported</p>
            </Card>
          </div>
        )}

        {/* Unlocked Achievements */}
        {achievements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Achievements</h2>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map(achievement => (
                <FanAchievementBadge 
                  key={achievement.type} 
                  achievement={achievement}
                />
              ))}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <Card className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No achievements unlocked yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
