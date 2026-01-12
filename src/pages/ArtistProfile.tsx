import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { useReproMode } from "@/contexts/ReproModeContext";
import { ArrowLeft, Award, Crown, Music, ShoppingBag, Play, Disc, ChevronDown, ChevronUp, Eye, Music2, Home, AlertTriangle, Users, Video, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/ScrollableTabs";
import { AnimatedTabTrigger } from "@/components/ui/AnimatedTabTrigger";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/CommentsSection";
import { SimilarArtists } from "@/components/SimilarArtists";
import { ShareModal } from "@/components/ShareModal";
import { ArtistHeroSection } from "@/components/artist/ArtistHeroSection";
import { ArtistAboutSection } from "@/components/artist/ArtistAboutSection";
import { ArtistSpotlightCard } from "@/components/artist/ArtistSpotlightCard";
import { ArtistVideosSection } from "@/components/artist/ArtistVideosSection";
import { PremiumTrackCard } from "@/components/artist/PremiumTrackCard";
import { EmptyStateCard } from "@/components/artist/EmptyStateCard";
import { ArtistStatsCard } from "@/components/artist/ArtistStatsCard";
import { FanTestimonialsSection } from "@/components/artist/FanTestimonialsSection";
import { CrossPromoteSection } from "@/components/artist/CrossPromoteSection";
import { MerchSection } from "@/components/artist/MerchSection";
import TopSupportersCard from "@/components/supporter/TopSupportersCard";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupportTierModal } from "@/components/supporter/SupportTierModal";
import { useArtistVerification } from "@/hooks/useArtistVerification";
import { useMetaTags } from "@/hooks/useMetaTags";
import { isValidUUID } from "@/lib/utils/validation";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { PreviewModeBanner } from "@/components/preview/PreviewModeBanner";
import { PreviewGateCTA } from "@/components/preview/PreviewGateCTA";
import { PreviewTrackList } from "@/components/artist/PreviewTrackList";
import { PreviewVideoGrid } from "@/components/artist/PreviewVideoGrid";
import { SpotlightCarousel } from "@/components/spotlight/SpotlightCarousel";
import { SpotlightSection } from "@/components/spotlight/SpotlightSection";
import { useArtistSpotlight } from "@/hooks/useArtistSpotlight";
import { useInboundTracking } from "@/hooks/useInboundTracking";
import { QuickAddButton } from "@/components/QuickAddButton";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
}

interface Track {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  audio_url: string;
  cover_url: string | null;
  artist_id: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  play_count: number;
  album_id: string | null;
  track_order: number | null;
}

interface Album {
  id: string;
  title: string;
  cover_url: string | null;
  description: string | null;
}

export default function ArtistProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playNow, addToQueue, setQueue } = useFlightdeck();
  const { isReproMode, issueId, reproLog, trackApiCall } = useReproMode();
  const isMobile = useIsMobile();
  const { isPreviewMode } = usePreviewMode();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [spotlightEntry, setSpotlightEntry] = useState<{
    campaignId: string;
    campaignName: string;
    votes: number;
    rank: number | null;
  } | null>(null);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [topSupporters, setTopSupporters] = useState<any[]>([]);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
  const [error, setError] = useState<'invalid' | null>(null);
  
  // Get verification status for this artist
  const { isVerified } = useArtistVerification(artist?.user_id);

  // Set Open Graph meta tags for social sharing
  useMetaTags(artist ? {
    title: `${artist.artist_name} | FlyMusic Gold`,
    description: artist.bio || `Discover ${artist.artist_name}'s music on FlyMusic Gold`,
    image: artist.avatar_url || '/flymusic-logo.png',
    type: 'profile',
  } : null);

  // Log page load in repro mode
  useEffect(() => {
    reproLog('PAGE_LOAD', 'ArtistProfile mounted', { userId, issueId });
  }, [userId, issueId, reproLog]);

  // Helper to resolve artist profile by user_id OR artist_profiles.id
  // This handles notification links that use artist_profiles.id instead of user_id
  const resolveArtistProfile = async (idOrUserId: string): Promise<Artist | null> => {
    trackApiCall('API', 'Resolving artist profile', { idOrUserId }, 'pending');
    
    // First try by user_id (the expected case for direct links)
    let { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', idOrUserId)
      .maybeSingle();

    // If not found, try by artist_profiles.id (for notification links)
    if (!data) {
      const result = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('id', idOrUserId)
        .maybeSingle();
      data = result.data;
      error = result.error;
    }

    if (error) {
      trackApiCall('API', 'Artist profile resolution failed', { error: error.message }, 'error');
    } else if (data) {
      trackApiCall('API', 'Artist profile resolved', { artistId: data.id, artistName: data.artist_name }, 'success');
    } else {
      trackApiCall('API', 'Artist not found', { idOrUserId }, 'error');
    }

    return data;
  };

  // Helper to convert track to FlightdeckItem
  const trackToFlightdeckItem = (track: Track): FlightdeckItem => ({
    id: track.id,
    type: 'track',
    title: track.title,
    artistId: artist?.id || '',
    artistName: artist?.artist_name || '',
    artistUserId: artist?.user_id || '',
    mediaUrl: track.audio_url,
    coverUrl: track.cover_url || undefined,
  });

  const handlePlayAll = () => {
    if (tracks.length === 0 || !artist) return;
    const allItems = tracks.map(trackToFlightdeckItem);
    setQueue(allItems, 0);
    toast.success(`Playing ${tracks.length} tracks`);
  };

  const handlePlayTrack = (track: Track) => {
    if (!artist) return;
    const item = trackToFlightdeckItem(track);
    playNow(item);
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(trackToFlightdeckItem(track));
  };

  useEffect(() => {
    if (userId) {
      fetchArtist();
    }
  }, [userId]);

  // Fetch related data once artist is resolved
  useEffect(() => {
    if (artist) {
      fetchTracks();
      checkFollowStatus();
      fetchUserLikes();
      fetchSpotlightStatus();
      fetchBetaAccess();
      fetchTopSupporters();
    }
  }, [artist, user]);

  useEffect(() => {
    if (artist) {
      fetchFollowerCount();

      const channel = supabase
        .channel("follows-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "follows", filter: `artist_id=eq.${artist.id}` },
          () => fetchFollowerCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [artist]);

  const fetchArtist = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    // Validate UUID format before any Supabase calls to prevent HTTP 400
    if (!isValidUUID(userId)) {
      console.error('[ArtistProfile] Invalid UUID format:', userId);
      setError('invalid');
      setLoading(false);
      return;
    }
    
    const data = await resolveArtistProfile(userId);
    
    if (!data) {
      console.error('Artist not found for id:', userId);
    }
    
    setArtist(data);
    setLoading(false);
  };

  const fetchTracks = async () => {
    if (!artist) return;

    // Fetch albums first
    const { data: albumsData } = await supabase
      .from('albums')
      .select('id, title, cover_url, description')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false });

    if (albumsData) {
      setAlbums(albumsData);
    }

    // Fetch tracks
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTracks(data);
    }
  };

  const fetchFollowerCount = async () => {
    if (!artist) return;

    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artist.id);

    setFollowerCount(count || 0);
  };

  const checkFollowStatus = async () => {
    if (!user || !artist) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('fan_id', user.id)
      .eq('artist_id', artist.id)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const fetchUserLikes = async () => {
    if (!user || !artist) return;

    const { data: tracksData } = await supabase
      .from('tracks')
      .select('id')
      .eq('artist_id', artist.id);

    if (!tracksData) return;

    const trackIds = tracksData.map(t => t.id);
    if (trackIds.length === 0) return;

    const { data: likes } = await supabase
      .from('likes')
      .select('track_id')
      .eq('user_id', user.id)
      .in('track_id', trackIds);

    const likedMap: Record<string, boolean> = {};
    likes?.forEach(like => {
      likedMap[like.track_id] = true;
    });
    setLikedTracks(likedMap);
  };

  const fetchSpotlightStatus = async () => {
    if (!artist) return;

    const { data: entry } = await supabase
      .from('spotlight_entries')
      .select(`
        id,
        campaign_id,
        total_votes,
        cached_rank,
        spotlight_campaigns!inner (
          name,
          status
        )
      `)
      .eq('artist_id', artist.id)
      .eq('status', 'approved')
      .eq('spotlight_campaigns.status', 'active')
      .maybeSingle();

    if (entry) {
      setSpotlightEntry({
        campaignId: entry.campaign_id,
        campaignName: entry.spotlight_campaigns.name,
        votes: entry.total_votes || 0,
        rank: entry.cached_rank,
      });
    }
  };

  const fetchBetaAccess = async () => {
    if (!artist) return;

    const { data: betaAccess } = await supabase
      .from("artist_beta_access")
      .select("badge_name")
      .eq("user_id", artist.user_id)
      .maybeSingle();

    setHasBetaAccess(!!betaAccess);
  };

  const fetchTopSupporters = async () => {
    if (!artist) return;

    const { data: supporters } = await supabase
      .from('fan_support_scores')
      .select(`
        fan_user_id,
        score,
        level,
        profiles (
          full_name,
          email
        )
      `)
      .eq('artist_id', artist.id)
      .order('score', { ascending: false })
      .limit(5);

    if (supporters) {
      setTopSupporters(supporters);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    if (!artist) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('fan_id', user.id)
        .eq('artist_id', artist.id);
      setIsFollowing(false);
      toast.success("Unfollowed");
    } else {
      await supabase
        .from('follows')
        .insert({ fan_id: user.id, artist_id: artist.id });
      setIsFollowing(true);
      toast.success("Following!");
    }
  };

  const handleLikeChange = (trackId: string, isLiked: boolean) => {
    setLikedTracks({ ...likedTracks, [trackId]: isLiked });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Invalid UUID error state - show before "not found" to prevent any API calls
  if (error === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive opacity-70" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid artist link</h2>
          <p className="text-muted-foreground mb-6">
            This link appears to be malformed or incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/explore')}
              className="gap-2 bg-primary"
            >
              <Home className="h-4 w-4" />
              Explore Artists
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <Music2 className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
          <p className="text-muted-foreground mb-6">
            This artist may have been removed or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/explore')}
              className="gap-2 bg-primary"
            >
              <Home className="h-4 w-4" />
              Explore Artists
            </Button>
          </div>
        </div>
        {isReproMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-md text-center mt-6">
            <p className="font-medium text-amber-600 mb-2">🔍 Repro Mode Debug Info</p>
            <p className="text-sm text-muted-foreground">
              Issue ID: {issueId || 'N/A'}<br/>
              Requested ID: {userId}<br/>
              This link may be outdated or incorrectly generated.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Check if current user is viewing their own artist profile
  const isViewingOwnProfile = user?.id === artist?.user_id;

  return (
    <>
      {/* Preview mode banner for non-beta users */}
      {isPreviewMode && <PreviewModeBanner variant="sticky" />}

      <div className={`min-h-screen pb-32 md:pb-28 ${isPreviewMode ? 'pt-nav-safe-preview' : 'pt-nav-safe'}`}>
      {/* "Viewing as Fan" Banner for artists viewing their own profile */}
      {isViewingOwnProfile && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">You're viewing your profile as fans see it</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/studio/profile')}
              className="text-xs"
            >
              Back to Studio
            </Button>
          </div>
        </div>
      )}
      
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Premium Hero Section */}
      <ArtistHeroSection
        artist={artist}
        followerCount={followerCount}
        isFollowing={isFollowing}
        hasBetaAccess={hasBetaAccess}
        isVerified={isVerified}
        onFollow={isPreviewMode ? undefined : handleFollow}
        onShare={() => setShowShareModal(true)}
      />

      {/* Spotlight / Pulse Carousel */}
      <SpotlightSection artistId={artist.id} artistName={artist.artist_name} />

      {/* Preview Mode CTA - shown after hero for non-beta users */}
      {isPreviewMode && (
        <div className="container mx-auto px-4 max-w-6xl">
          <PreviewGateCTA />
        </div>
      )}

      {/* Main Content Area with Tabs */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="tracks" className="w-full">
              <ScrollableTabsList>
                <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 mb-0 min-w-max md:min-w-0">
                  <AnimatedTabTrigger value="tracks" icon={<Music className="w-4 h-4" />}>
                    Tracks
                  </AnimatedTabTrigger>
                  <AnimatedTabTrigger value="videos" icon={<Video className="w-4 h-4" />}>
                    Videos
                  </AnimatedTabTrigger>
                  <AnimatedTabTrigger value="merch" icon={<ShoppingBag className="w-4 h-4" />}>
                    Merch
                  </AnimatedTabTrigger>
                  <AnimatedTabTrigger value="about" icon={<Info className="w-4 h-4" />}>
                    About
                  </AnimatedTabTrigger>
                  <AnimatedTabTrigger value="community" icon={<Users className="w-4 h-4" />}>
                    Community
                  </AnimatedTabTrigger>
                </TabsList>
              </ScrollableTabsList>

              {/* Tracks Tab */}
              <TabsContent value="tracks" className="mt-6 md:mt-8">
                {tracks.length === 0 ? (
                  <EmptyStateCard
                    icon={Music}
                    title="No Tracks Yet"
                    description="This artist is working on new music. Follow them to get notified when they release!"
                    ctaText={isFollowing ? "Explore More Artists" : "Follow Artist"}
                    onCtaClick={isFollowing || isPreviewMode ? undefined : handleFollow}
                    ctaPath={isFollowing ? "/explore" : undefined}
                    variant="gold"
                  />
                ) : isPreviewMode ? (
                  /* Preview Mode: Show limited track list */
                  <PreviewTrackList tracks={tracks.map(t => ({ id: t.id, title: t.title, cover_url: t.cover_url }))} />
                ) : (
                  <div className="space-y-6">
                    {/* Play All Button */}
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={handlePlayAll}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play All ({tracks.length})
                      </Button>
                    </div>
                    
                    {/* Group tracks by album */}
                    {(() => {
                      // Group tracks by album_id
                      const albumTracks: Record<string, Track[]> = {};
                      const singleTracks: Track[] = [];
                      
                      tracks.forEach(track => {
                        if (track.album_id) {
                          if (!albumTracks[track.album_id]) {
                            albumTracks[track.album_id] = [];
                          }
                          albumTracks[track.album_id].push(track);
                        } else {
                          singleTracks.push(track);
                        }
                      });

                      // Sort tracks within albums by track_order
                      Object.keys(albumTracks).forEach(albumId => {
                        albumTracks[albumId].sort((a, b) => (a.track_order || 0) - (b.track_order || 0));
                      });

                      return (
                        <div className="space-y-6">
                          {/* Albums with their tracks - Collapsible */}
                          {albums.filter(album => albumTracks[album.id]?.length > 0).map(album => {
                            const albumCover = album.cover_url || albumTracks[album.id]?.[0]?.cover_url;
                            return (
                              <Collapsible key={album.id} defaultOpen={true} className="border-l-2 border-primary/50 pl-4">
                                <CollapsibleTrigger className="w-full">
                                  {/* Album Header - Clickable to toggle */}
                                  <div className="flex items-center gap-3 pb-2 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -ml-2 transition-colors group">
                                    {albumCover ? (
                                      <img 
                                        src={albumCover} 
                                        alt={album.title}
                                        className="w-12 h-12 rounded-lg object-cover border border-border/50"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-border/50">
                                        <Disc className="h-6 w-6 text-primary" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 text-left">
                                      <h3 className="font-semibold text-lg text-foreground truncate">{album.title}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {albumTracks[album.id].length} {albumTracks[album.id].length === 1 ? 'track' : 'tracks'}
                                      </p>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-muted-foreground group-data-[state=open]:hidden" />
                                    <ChevronUp className="h-5 w-5 text-muted-foreground hidden group-data-[state=open]:block" />
                                  </div>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent>
                                  {/* Album Tracks with numbers */}
                                  <div className="space-y-2 pt-2">
                                    {albumTracks[album.id].map((track, index) => (
                                      <div key={track.id} className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground/70 w-6 text-right flex-shrink-0">
                                          {index + 1}.
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <PremiumTrackCard
                                            track={track}
                                            artistName={artist.artist_name}
                                            isLiked={likedTracks[track.id]}
                                            onPlay={() => handlePlayTrack(track)}
                                            onAddToQueue={() => handleAddToQueue(track)}
                                            onLikeChange={(isLiked) => handleLikeChange(track.id, isLiked)}
                                            showCollaborators={true}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}

                          {/* Singles Section */}
                          {singleTracks.length > 0 && (
                            <div className="space-y-3">
                              {albums.some(album => albumTracks[album.id]?.length > 0) && (
                                <div className="flex items-center gap-2 pb-2">
                                  <Music className="h-5 w-5 text-muted-foreground" />
                                  <h3 className="font-semibold text-lg text-foreground">Singles</h3>
                                  <span className="text-sm text-muted-foreground">
                                    ({singleTracks.length})
                                  </span>
                                </div>
                              )}
                              <div className="space-y-3">
                                {singleTracks.map((track) => (
                                  <PremiumTrackCard
                                    key={track.id}
                                    track={track}
                                    artistName={artist.artist_name}
                                    isLiked={likedTracks[track.id]}
                                    onPlay={() => handlePlayTrack(track)}
                                    onAddToQueue={() => handleAddToQueue(track)}
                                    onLikeChange={(isLiked) => handleLikeChange(track.id, isLiked)}
                                    showCollaborators={true}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos" className="mt-0">
                <ArtistVideosSection
                  artistId={artist.id}
                  artistName={artist.artist_name}
                />
              </TabsContent>

              {/* Merch Tab */}
              <TabsContent value="merch" className="mt-0">
                <MerchSection artistId={artist.id} />
              </TabsContent>

              {/* About Tab */}
              {/* Community Tab */}
              <TabsContent value="community" className="mt-0">
                <div className="text-center py-12 bg-card/50 rounded-xl border border-border">
                  <Users className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Join {artist.artist_name}'s Community</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Get exclusive posts, behind-the-scenes content and connect with other fans.
                  </p>
                  <Button 
                    onClick={() => navigate(`/artist/${artist.id}/community`)} 
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Crown className="h-4 w-4" />
                    Enter Community
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div className="space-y-6">
            {/* Artist Stats Card */}
            <ArtistStatsCard artistId={artist.id} />

            {/* Spotlight Card */}
            {spotlightEntry && (
              <ArtistSpotlightCard
                campaignId={spotlightEntry.campaignId}
                campaignName={spotlightEntry.campaignName}
                votes={spotlightEntry.votes}
                rank={spotlightEntry.rank || undefined}
              />
            )}

            {/* Become a Supporter */}
            {user && artist.user_id !== user.id && (
              <Button
                onClick={() => setShowSupporterModal(true)}
                className="w-full bg-gradient-gold hover:opacity-90"
              >
                <Crown className="h-4 w-4 mr-2" />
                Become a Supporter
              </Button>
            )}

            {/* Achievements Link - with spacing */}
            <Link to={`/artist/${userId}/achievements`} className="mt-4 block">
              <Button
                variant="outline"
                className="w-full border-primary/50 hover:border-primary hover:bg-primary/10"
              >
                <Award className="h-4 w-4 mr-2" />
                View Achievements
              </Button>
            </Link>

            {/* Top Supporters */}
            {topSupporters.length > 0 && (
              <TopSupportersCard supporters={topSupporters} />
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl border-t border-border">
        <CommentsSection artistId={artist.id} currentUserId={artist.user_id} />
      </div>

      {/* Fan Testimonials Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl border-t border-border">
        <FanTestimonialsSection artistId={artist.id} />
      </div>

      {/* Cross Promotion Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl border-t border-border">
        <CrossPromoteSection artistId={artist.id} />
      </div>

      {/* Similar Artists Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl border-t border-border">
        <SimilarArtists currentArtistId={artist.id} currentGenre={artist.genre} />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        artistName={artist.artist_name}
        shareUrl={window.location.href}
        artistId={artist.id}
      />

      {/* Become a Supporter Modal */}
      <SupportTierModal
        open={showSupporterModal}
        onOpenChange={setShowSupporterModal}
        artistId={artist.id}
        artistName={artist.artist_name}
      />
      
      {/* Quick Add Floating Button */}
      <QuickAddButton />
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
