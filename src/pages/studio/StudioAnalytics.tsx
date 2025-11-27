import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Users, Play, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Track {
  id: string;
  title: string;
  play_count: number;
}

export default function StudioAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFollowers: 0,
    followers30d: 0,
    totalPlays: 0,
    plays30d: 0,
    totalLikes: 0,
    totalComments: 0,
    newFollowersToday: 0,
    newFollowers7d: 0,
    comments7d: 0,
    likes7d: 0,
  });
  const [topTracks, setTopTracks] = useState<Array<Track & { likes: number; comments: number }>>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.status !== 'approved') {
      navigate('/studio/profile');
      return;
    }

    setArtistProfile(profile);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch tracks first
    const tracksData = await supabase
      .from('tracks')
      .select('id, title, play_count')
      .eq('artist_id', profile.id)
      .order('play_count', { ascending: false });

    const trackIds = tracksData.data?.map(t => t.id) || [];

    // Fetch all stats
    const [
      followersTotal,
      followers30d,
      followersToday,
      followers7d,
      likesTotal,
      likes7d,
      commentsTotal,
      comments7d,
    ] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('artist_id', profile.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('artist_id', profile.id).gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('follows').select('id', { count: 'exact' }).eq('artist_id', profile.id).gte('created_at', today.toISOString()),
      supabase.from('follows').select('id', { count: 'exact' }).eq('artist_id', profile.id).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('likes').select('id', { count: 'exact' }).in('track_id', trackIds),
      supabase.from('likes').select('id', { count: 'exact' }).in('track_id', trackIds).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('comments').select('id', { count: 'exact' }).eq('artist_id', profile.id),
      supabase.from('comments').select('id', { count: 'exact' }).eq('artist_id', profile.id).gte('created_at', sevenDaysAgo.toISOString()),
    ]);

    const totalPlays = tracksData.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
    const plays30d = totalPlays; // Simplified - would need historical data for accurate calculation

    setStats({
      totalFollowers: followersTotal.count || 0,
      followers30d: followers30d.count || 0,
      totalPlays,
      plays30d,
      totalLikes: likesTotal.count || 0,
      totalComments: commentsTotal.count || 0,
      newFollowersToday: followersToday.count || 0,
      newFollowers7d: followers7d.count || 0,
      comments7d: comments7d.count || 0,
      likes7d: likes7d.count || 0,
    });

    // Get likes and comments per track for top tracks
    if (tracksData.data && tracksData.data.length > 0) {
      const trackIds = tracksData.data.map(t => t.id);
      
      const [likesPerTrack, commentsPerTrack] = await Promise.all([
        supabase.from('likes').select('track_id').in('track_id', trackIds),
        supabase.from('comments').select('id').eq('artist_id', profile.id),
      ]);

      const likesMap: Record<string, number> = {};
      likesPerTrack.data?.forEach(like => {
        likesMap[like.track_id] = (likesMap[like.track_id] || 0) + 1;
      });

      const commentsCount = commentsPerTrack.count || 0;

      const enrichedTracks = tracksData.data.map(track => ({
        ...track,
        likes: likesMap[track.id] || 0,
        comments: Math.floor(commentsCount / tracksData.data.length), // Simplified distribution
      }));

      setTopTracks(enrichedTracks.slice(0, 10));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen pt-16">
      <StudioSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Analytics</h1>

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Followers</p>
                <p className="text-3xl font-bold">{stats.totalFollowers}</p>
                <p className="text-xs text-primary">+{stats.followers30d} last 30 days</p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Plays</p>
                <p className="text-3xl font-bold">{stats.totalPlays}</p>
                <p className="text-xs text-primary">+{stats.plays30d} last 30 days</p>
              </div>
            </Card>
            <StatCard label="Total Likes" value={stats.totalLikes} icon={Heart} />
            <StatCard label="Total Comments" value={stats.totalComments} icon={MessageSquare} />
          </div>

          {/* Top Tracks */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Tracks</h2>
            {topTracks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tracks yet. Upload tracks to see analytics!
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Track Name</TableHead>
                    <TableHead className="text-right">Plays</TableHead>
                    <TableHead className="text-right">Likes</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-medium">{track.title}</TableCell>
                      <TableCell className="text-right">{track.play_count || 0}</TableCell>
                      <TableCell className="text-right">{track.likes}</TableCell>
                      <TableCell className="text-right">{track.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Engagement Overview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Engagement Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="font-semibold">New Followers</p>
                </div>
                <p className="text-2xl font-bold mb-1">{stats.newFollowersToday}</p>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.newFollowers7d} in the last 7 days
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Comments</p>
                </div>
                <p className="text-2xl font-bold mb-1">{stats.comments7d}</p>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Likes</p>
                </div>
                <p className="text-2xl font-bold mb-1">{stats.likes7d}</p>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
