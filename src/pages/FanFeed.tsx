import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReproMode } from "@/contexts/ReproModeContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { toast } from "sonner";
import { DashboardFeedSwitch } from "@/components/fan/DashboardFeedSwitch";
import { TrackCardSkeleton, CardSkeleton } from "@/components/ui/skeletons";
import { PageTransition } from "@/components/ui/PageTransition";
import { FeedTabs, FeedTab } from "@/components/feed/FeedTabs";
import { FeedMusicTab } from "@/components/feed/FeedMusicTab";
import { FeedVideosTab } from "@/components/feed/FeedVideosTab";
import { FeedSpotlightTab } from "@/components/feed/FeedSpotlightTab";
import { FeedArtistsTab } from "@/components/feed/FeedArtistsTab";
import { FeedSidebar } from "@/components/feed/FeedSidebar";

interface NewTrack {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  created_at: string;
  artist_profiles: {
    artist_name: string;
    user_id: string;
  };
}

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  thumbnail_url: string | null;
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export default function FanFeed() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { playNow, addToQueue, setQueue } = useFlightdeck();
  const { reproLog, trackApiCall } = useReproMode();
  const [newTracks, setNewTracks] = useState<NewTrack[]>([]);
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [followedGenres, setFollowedGenres] = useState<string[]>([]);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [liveArtistIds, setLiveArtistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('music');
  const isMobile = useIsMobile();

  // Log page load in repro mode
  useEffect(() => {
    reproLog('PAGE_LOAD', 'FanFeed mounted');
  }, [reproLog]);

  // Helper to convert track to FlightdeckItem
  const trackToFlightdeckItem = (track: NewTrack): FlightdeckItem => ({
    id: track.id,
    type: 'track',
    title: track.title,
    artistId: track.id,
    artistName: track.artist_profiles.artist_name,
    artistUserId: track.artist_profiles.user_id,
    mediaUrl: track.audio_url,
    coverUrl: track.cover_url || undefined,
  });

  const handlePlayAll = () => {
    if (newTracks.length === 0) return;
    const allItems = newTracks.map(trackToFlightdeckItem);
    setQueue(allItems, 0);
    toast.success(t('toast.playingTracks').replace('{count}', String(newTracks.length)));
  };

  const handlePlayTrack = (track: NewTrack) => {
    const item = trackToFlightdeckItem(track);
    playNow(item);
  };

  const handleAddToQueue = (track: NewTrack) => {
    addToQueue(trackToFlightdeckItem(track));
    toast.success(t('toast.addedToQueue').replace('{title}', track.title));
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFeedData();
  }, [user, navigate]);

  // Real-time subscription for live stream changes
  useEffect(() => {
    if (followedArtistIds.length === 0) return;

    const channel = supabase
      .channel('fan-feed-live-streams')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artist_live_streams',
        },
        (payload) => {
          const record = payload.new as { artist_id: string; status: string } | null;
          const oldRecord = payload.old as { artist_id: string; status: string } | null;

          const artistId = record?.artist_id || oldRecord?.artist_id;
          if (!artistId || !followedArtistIds.includes(artistId)) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (record?.status === 'live') {
              setLiveArtistIds((prev) => new Set([...prev, artistId]));
            } else {
              setLiveArtistIds((prev) => {
                const next = new Set(prev);
                next.delete(artistId);
                return next;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setLiveArtistIds((prev) => {
              const next = new Set(prev);
              next.delete(artistId);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [followedArtistIds]);

  const fetchFeedData = async () => {
    if (!user) return;

    try {
      trackApiCall('API', 'Fetching followed artists', { userId: user.id }, 'pending');
      
      // Fetch followed artists
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select(`
          artist_id,
          artist_profiles (
            id,
            genre
          )
        `)
        .eq('fan_id', user.id);

      if (followsError) {
        trackApiCall('API', 'Follows fetch failed', { error: followsError.message }, 'error');
      } else {
        trackApiCall('API', 'Follows fetched', { count: follows?.length || 0 }, 'success');
      }

      const artistIds = follows?.map(f => f.artist_id) || [];
      const genres = [...new Set(follows?.map(f => f.artist_profiles?.genre).filter(Boolean) as string[])];
      
      setFollowedArtistIds(artistIds);
      setFollowedGenres(genres);

      // Fetch latest tracks from followed artists
      if (artistIds.length > 0) {
        const { data: tracksData } = await supabase
          .from('tracks')
          .select(`
            id,
            title,
            description,
            audio_url,
            cover_url,
            created_at,
            artist_profiles (
              artist_name,
              user_id
            )
          `)
          .in('artist_id', artistIds)
          .order('created_at', { ascending: false })
          .limit(20);

        setNewTracks(tracksData || []);

        // Fetch video posts from followed artists
        const { data: videosData } = await supabase
          .from('artist_video_posts')
          .select(`
            id,
            video_url,
            caption,
            created_at,
            thumbnail_url,
            artist_profiles (
              id,
              user_id,
              artist_name,
              avatar_url
            )
          `)
          .in('artist_id', artistIds)
          .order('created_at', { ascending: false })
          .limit(20);

        setVideoPosts(videosData || []);

        // Fetch live streams for followed artists
        const { data: liveStreams } = await supabase
          .from('artist_live_streams')
          .select('artist_id')
          .in('artist_id', artistIds)
          .eq('status', 'live');

        if (liveStreams) {
          setLiveArtistIds(new Set(liveStreams.map((s) => s.artist_id)));
        }
      }

      // Fetch user's liked tracks
      const { data: likes } = await supabase
        .from('likes')
        .select('track_id')
        .eq('user_id', user.id);

      setLikedTrackIds(new Set(likes?.map(l => l.track_id) || []));

    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeChange = (trackId: string, isLiked: boolean) => {
    setLikedTrackIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(trackId);
      } else {
        newSet.delete(trackId);
      }
      return newSet;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'music':
        return (
          <FeedMusicTab
            tracks={newTracks}
            likedTrackIds={likedTrackIds}
            onPlayAll={handlePlayAll}
            onPlayTrack={handlePlayTrack}
            onAddToQueue={handleAddToQueue}
            onLikeChange={handleLikeChange}
          />
        );
      case 'videos':
        return <FeedVideosTab videos={videoPosts} />;
      case 'spotlight':
        return <FeedSpotlightTab onPlayTrack={playNow} />;
      case 'artists':
        return (
          <FeedArtistsTab
            followedGenres={followedGenres}
            followedArtistIds={followedArtistIds}
            liveArtistIds={liveArtistIds}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <MobileFanNav />
      <div className="flex w-full pt-16 min-h-[100dvh]" style={{ minHeight: '100dvh' }}>
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-52 md:pb-8 overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
          <PageBreadcrumb role="fan" />
          
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <>
                {/* Sticky header skeleton — same structure as loaded state */}
                <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-3 border-b border-border/50 md:static md:z-auto md:bg-transparent md:backdrop-blur-none md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-b-0">
                  <div className="space-y-2 mb-3">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-12 w-full max-w-md" />
                </div>

                <div className="pt-4 md:pt-5 grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <TrackCardSkeleton key={i} />
                    ))}
                  </div>
                  <div className="hidden lg:block space-y-6">
                    <CardSkeleton lines={4} />
                    <CardSkeleton lines={3} />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Sticky header — outside PageTransition so transform doesn't break sticky */}
                <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-3 border-b border-border/50 md:static md:z-auto md:bg-transparent md:backdrop-blur-none md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-b-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold mb-1">{t('fan.yourFeed')}</h1>
                    </div>
                  </div>
                  <FeedTabs 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    counts={{ music: newTracks.length, videos: videoPosts.length }}
                  />
                </div>

                {/* Content — only this part gets the page transition animation */}
                <PageTransition>
                  <div className="pt-4 md:pt-5 grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      {renderTabContent()}
                    </div>
                    <div className="hidden lg:block">
                      <FeedSidebar
                        followedArtistIds={followedArtistIds}
                        onTrackPlay={playNow}
                        followingCount={followedArtistIds.length}
                      />
                    </div>
                  </div>
                </PageTransition>
              </>
            )}
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
