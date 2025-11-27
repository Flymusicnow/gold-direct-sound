import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { StatCard } from "@/components/StatCard";
import { RecentFanActivity } from "@/components/artist/RecentFanActivity";
import { LatestReleases } from "@/components/artist/LatestReleases";
import { QuickActions } from "@/components/artist/QuickActions";
import { UpcomingEventsPreview } from "@/components/artist/UpcomingEventsPreview";
import { PostUpdateForm } from "@/components/artist/PostUpdateForm";
import { RecentPosts } from "@/components/artist/RecentPosts";
import SpotlightPromoCard from "@/components/spotlight/SpotlightPromoCard";
import { Users, Play, Heart, MessageSquare, Sparkles } from "lucide-react";

interface Stats {
  followers: number;
  totalPlays: number;
  totalLikes: number;
  totalComments: number;
}

export default function StudioDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ followers: 0, totalPlays: 0, totalLikes: 0, totalComments: 0 });
  const [tracks, setTracks] = useState<any[]>([]);
  const [trackLikes, setTrackLikes] = useState<Record<string, number>>({});
  const [trackComments, setTrackComments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshPosts, setRefreshPosts] = useState(0);
  const [hasActiveSpotlightEntry, setHasActiveSpotlightEntry] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch artist profile
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

    // Fetch tracks first
    const tracksData = await supabase
      .from('tracks')
      .select('id, title, cover_url, play_count')
      .eq('artist_id', profile.id)
      .order('created_at', { ascending: false });

    const trackIds = tracksData.data?.map(t => t.id) || [];

    // Fetch stats
    const [followersData, likesData, commentsData] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('artist_id', profile.id),
      supabase.from('likes').select('id', { count: 'exact' }).in('track_id', trackIds),
      supabase.from('comments').select('id', { count: 'exact' }).eq('artist_id', profile.id),
    ]);

    const totalPlays = tracksData.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;

    setStats({
      followers: followersData.count || 0,
      totalPlays,
      totalLikes: likesData.count || 0,
      totalComments: commentsData.count || 0,
    });

    setTracks(tracksData.data || []);

    // Fetch likes and comments per track
    if (tracksData.data && tracksData.data.length > 0) {
      const trackIds = tracksData.data.map(t => t.id);
      
      const { data: likesPerTrack } = await supabase
        .from('likes')
        .select('track_id')
        .in('track_id', trackIds);

      const { data: commentsPerTrack } = await supabase
        .from('comments')
        .select('id')
        .in('artist_id', [profile.id]);

      const likesMap: Record<string, number> = {};
      likesPerTrack?.forEach(like => {
        likesMap[like.track_id] = (likesMap[like.track_id] || 0) + 1;
      });

      const commentsMap: Record<string, number> = {};
      commentsPerTrack?.forEach(() => {
        commentsMap[profile.id] = (commentsMap[profile.id] || 0) + 1;
      });

      setTrackLikes(likesMap);
      setTrackComments(commentsMap);
    }

    // Check for active Spotlight entry
    const { data: spotlightEntry } = await supabase
      .from('spotlight_entries')
      .select(`
        id,
        spotlight_campaigns!inner (status)
      `)
      .eq('artist_id', profile.id)
      .eq('status', 'approved')
      .eq('spotlight_campaigns.status', 'active')
      .limit(1)
      .maybeSingle();

    setHasActiveSpotlightEntry(!!spotlightEntry);

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
      <MobileStudioNav />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Premium Header */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Creator Control Room
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Welcome back, {artistProfile?.artist_name}
                </p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground/80 ml-15">
              Track your impact, releases and fan engagement in one place
            </p>
          </div>

          {/* Spotlight Promo - Show if artist has active entry */}
          {hasActiveSpotlightEntry && (
            <SpotlightPromoCard />
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Followers" value={stats.followers} icon={Users} />
            <StatCard label="Total Plays" value={stats.totalPlays} icon={Play} />
            <StatCard label="Total Likes" value={stats.totalLikes} icon={Heart} />
            <StatCard label="Comments" value={stats.totalComments} icon={MessageSquare} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <LatestReleases tracks={tracks} likes={trackLikes} comments={trackComments} />
            <RecentFanActivity artistId={artistProfile.id} />
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Events and Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <UpcomingEventsPreview artistId={artistProfile.id} />
            <RecentPosts artistId={artistProfile.id} refreshTrigger={refreshPosts} />
          </div>

          {/* Post Update Form */}
          <PostUpdateForm artistId={artistProfile.id} onPostCreated={() => setRefreshPosts(prev => prev + 1)} />
        </div>
      </main>
    </div>
  );
}
