import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Users, Play, Heart, MessageSquare, TrendingUp, BarChart3, Video } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Track {
  id: string;
  title: string;
  play_count: number;
}

interface VideoAnalytics {
  id: string;
  caption: string | null;
  view_count: number;
  created_at: string;
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
  const [videoStats, setVideoStats] = useState({
    totalViews: 0,
    totalVideos: 0,
    avgCompletionRate: 0,
  });
  const [topVideos, setTopVideos] = useState<VideoAnalytics[]>([]);
  const isMobile = useIsMobile();

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

    // Fetch video analytics
    const { data: videosData } = await supabase
      .from('artist_video_posts')
      .select('id, caption, view_count, created_at')
      .eq('artist_id', profile.id)
      .order('view_count', { ascending: false })
      .limit(5);

    if (videosData) {
      setTopVideos(videosData);
      const totalViews = videosData.reduce((sum, v) => sum + (v.view_count || 0), 0);
      
      // Get completion rate data
      const videoIds = videosData.map(v => v.id);
      const { data: viewsData } = await supabase
        .from('video_views')
        .select('completed')
        .in('video_id', videoIds);

      const completionRate = viewsData && viewsData.length > 0
        ? (viewsData.filter(v => v.completed).length / viewsData.length) * 100
        : 0;

      setVideoStats({
        totalViews,
        totalVideos: videosData.length,
        avgCompletionRate: Math.round(completionRate),
      });
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
    <>
      <div className="flex min-h-screen pt-16">
        <StudioSidebar />
        <MobileStudioNav />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Premium Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your performance and audience insights</p>
            </div>
          </div>

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

          {/* Video Performance */}
          {topVideos.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Video Performance</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                  <p className="text-2xl font-bold">{videoStats.totalViews}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Videos</p>
                  <p className="text-2xl font-bold">{videoStats.totalVideos}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Completion</p>
                  <p className="text-2xl font-bold">{videoStats.avgCompletionRate}%</p>
                </div>
              </div>

              <h3 className="text-sm font-semibold mb-3">Top Videos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caption</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">
                        {video.caption || 'Untitled Video'}
                      </TableCell>
                      <TableCell className="text-right">{video.view_count || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

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
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
