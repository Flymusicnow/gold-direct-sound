import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReproMode } from "@/contexts/ReproModeContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { CollapsibleStatCard } from "@/components/mobile/CollapsibleStatCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { RecentFanActivity } from "@/components/artist/RecentFanActivity";
import { LatestReleases } from "@/components/artist/LatestReleases";
import { QuickActions } from "@/components/artist/QuickActions";
import { UpcomingEventsPreview } from "@/components/artist/UpcomingEventsPreview";
import { PostUpdateForm } from "@/components/artist/PostUpdateForm";
import { RecentPosts } from "@/components/artist/RecentPosts";
import { SpotlightStatsCard } from "@/components/spotlight/SpotlightStatsCard";
import { ArtistOnboardingDialog } from "@/components/artist/ArtistOnboardingDialog";
import { EarlyAccessBadge } from "@/components/artist/EarlyAccessBadge";
import { ArtistAchievementsCard } from "@/components/artist/ArtistAchievementsCard";
import { TopSupportersWidget } from "@/components/artist/TopSupportersWidget";
import { LiveViewerActivityWidget } from "@/components/artist/LiveViewerActivityWidget";
import { Users, Play, Heart, MessageSquare, Sparkles, Eye, ExternalLink } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Link } from "react-router-dom";
import { VerifiedBadge } from "@/components/artist/VerifiedBadge";
import { useArtistVerification } from "@/hooks/useArtistVerification";
import { useLanguage } from "@/contexts/LanguageContext";

interface Stats {
  followers: number;
  totalPlays: number;
  totalLikes: number;
  totalComments: number;
}

export default function StudioDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reproLog, trackApiCall } = useReproMode();
  const isMobile = useIsMobile();
  const { isVerified } = useArtistVerification();
  const { t } = useLanguage();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ followers: 0, totalPlays: 0, totalLikes: 0, totalComments: 0 });
  const [tracks, setTracks] = useState<any[]>([]);
  const [trackLikes, setTrackLikes] = useState<Record<string, number>>({});
  const [trackComments, setTrackComments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshPosts, setRefreshPosts] = useState(0);
  const [hasActiveSpotlightEntry, setHasActiveSpotlightEntry] = useState(false);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);

  // Log page load in repro mode
  useEffect(() => {
    reproLog('PAGE_LOAD', 'StudioDashboard mounted');
  }, [reproLog]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    trackApiCall('API', 'Fetching artist profile', { userId: user.id }, 'pending');
    
    // Fetch artist profile
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      trackApiCall('API', 'Artist profile fetch failed', { error: profileError.message }, 'error');
    } else {
      trackApiCall('API', 'Artist profile fetched', { artistName: profile?.artist_name }, 'success');
    }

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

    // Check for beta access
    const { data: betaAccess } = await supabase
      .from("artist_beta_access")
      .select("badge_name")
      .eq("user_id", user.id)
      .maybeSingle();

    setHasBetaAccess(!!betaAccess);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen pt-16 pb-16 md:pb-0">
        <StudioSidebar />
        {!isMobile && <MobileStudioNav />}
        <ArtistOnboardingDialog />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Premium Header */}
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {t('studio.controlRoom')}
                    </h1>
                    {isVerified && <VerifiedBadge size="lg" />}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground min-w-0">
                    <span className="truncate">
                      {t('studio.welcomeBack')}{artistProfile?.artist_name ? `, ${artistProfile.artist_name}` : ''}
                    </span>
                    {' '}
                    <Link to="/learn?tab=artist" className="text-primary hover:underline whitespace-nowrap">
                      {t('studio.learnFlyMusic')} →
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/artist/${user?.id}`, '_blank')}
                  className="hidden md:flex"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('studio.previewAsFan')}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                {hasBetaAccess && <EarlyAccessBadge />}
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground/80 ml-15">
              {t('studio.trackImpact')}
            </p>
          </div>

          {/* Spotlight Stats - Show if artist has active entry */}
          {hasActiveSpotlightEntry && (
            <SpotlightStatsCard artistId={artistProfile.id} />
          )}

          {/* Artist Achievements */}
          <ArtistAchievementsCard />

          {/* Stats */}
          {isMobile ? (
            <div className="grid grid-cols-1 gap-3">
              <CollapsibleStatCard
                icon={Users}
                label={t('artist.followers')}
                value={stats.followers}
                trend={t('studio.yourFanCommunity')}
              />
              <CollapsibleStatCard
                icon={Play}
                label={t('studio.totalPlays')}
                value={stats.totalPlays}
                trend={t('studio.acrossAllTracks')}
              />
              <CollapsibleStatCard
                icon={Heart}
                label={t('studio.totalLikes')}
                value={stats.totalLikes}
                trend={t('studio.fanEngagement')}
              />
              <CollapsibleStatCard
                icon={MessageSquare}
                label={t('artist.comments')}
                value={stats.totalComments}
                trend={t('studio.communityFeedback')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard label={t('artist.followers')} value={stats.followers} icon={Users} />
              <StatCard label={t('studio.totalPlays')} value={stats.totalPlays} icon={Play} />
              <StatCard label={t('studio.totalLikes')} value={stats.totalLikes} icon={Heart} />
              <StatCard label={t('artist.comments')} value={stats.totalComments} icon={MessageSquare} />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <LatestReleases tracks={tracks} likes={trackLikes} comments={trackComments} />
            <div className="space-y-4 md:space-y-6">
              <LiveViewerActivityWidget artistId={artistProfile.id} />
              <RecentFanActivity artistId={artistProfile.id} />
              <TopSupportersWidget artistId={artistProfile.id} />
            </div>
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
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
