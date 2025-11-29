import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Music, Heart, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ArtistStats {
  totalPlays: number;
  totalLikes: number;
  totalFollowers: number;
  playsLast30Days: number;
  likesLast30Days: number;
  followersLast30Days: number;
}

interface ArtistStatsCardProps {
  artistId: string;
}

export function ArtistStatsCard({ artistId }: ArtistStatsCardProps) {
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [artistId]);

  const fetchStats = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch tracks to get play counts
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id, play_count")
        .eq("artist_id", artistId);

      const totalPlays = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;

      // Fetch total likes
      const { count: totalLikes } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .in("track_id", tracks?.map(t => t.id) || []);

      // Fetch likes last 30 days
      const { count: likesLast30Days } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .in("track_id", tracks?.map(t => t.id) || [])
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Fetch total followers
      const { count: totalFollowers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId);

      // Fetch followers last 30 days
      const { count: followersLast30Days } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      setStats({
        totalPlays,
        totalLikes: totalLikes || 0,
        totalFollowers: totalFollowers || 0,
        playsLast30Days: 0, // Note: We don't track individual plays by date yet
        likesLast30Days: likesLast30Days || 0,
        followersLast30Days: followersLast30Days || 0,
      });
    } catch (error) {
      console.error("Error fetching artist stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (recent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((recent / total) * 100);
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Artist Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Music,
      label: "Plays",
      value: stats.totalPlays,
      recent: stats.playsLast30Days,
      color: "text-blue-400",
    },
    {
      icon: Heart,
      label: "Likes",
      value: stats.totalLikes,
      recent: stats.likesLast30Days,
      color: "text-primary",
    },
    {
      icon: Users,
      label: "Followers",
      value: stats.totalFollowers,
      recent: stats.followersLast30Days,
      color: "text-green-400",
    },
  ];

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Artist Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statItems.map((item) => {
          const percentage = calculatePercentage(item.recent, item.value);
          return (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <div>
                  <p className="text-sm font-medium">{item.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
              {item.recent > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{percentage}%</span>
                </div>
              )}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Last 30 days
        </p>
      </CardContent>
    </Card>
  );
}
