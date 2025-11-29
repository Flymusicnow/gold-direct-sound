import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFlightdeck } from "@/contexts/FlightdeckContext";
import { Award, Music, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
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
  play_count: number;
}

export default function ArtistProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { playNow } = useFlightdeck();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
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

  useEffect(() => {
    if (userId) {
      fetchArtist();
      fetchTracks();
      checkFollowStatus();
      fetchUserLikes();
      fetchSpotlightStatus();
      fetchBetaAccess();
      fetchTopSupporters();
    }
  }, [userId, user]);

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
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching artist:', error);
    } else {
      setArtist(data);
    }
    setLoading(false);
  };

  const fetchTracks = async () => {
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (artistData) {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', artistData.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTracks(data);
      }
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
    if (!user) return;

    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (artistData) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('fan_id', user.id)
        .eq('artist_id', artistData.id)
        .single();

      setIsFollowing(!!data);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!artistData) return;

    const { data: tracksData } = await supabase
      .from('tracks')
      .select('id')
      .eq('artist_id', artistData.id);

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
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!artistData) return;

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
      .eq('artist_id', artistData.id)
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
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!artistData) return;

    const { data: betaAccess } = await supabase
      .from("artist_beta_access")
      .select("badge_name")
      .eq("user_id", artistData.user_id)
      .maybeSingle();

    setHasBetaAccess(!!betaAccess);
  };

  const fetchTopSupporters = async () => {
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!artistData) return;

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
      .eq('artist_id', artistData.id)
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

    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!artistData) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('fan_id', user.id)
        .eq('artist_id', artistData.id);
      setIsFollowing(false);
      toast.success("Unfollowed");
    } else {
      await supabase
        .from('follows')
        .insert({ fan_id: user.id, artist_id: artistData.id });
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

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-32">
      {/* Premium Hero Section */}
      <ArtistHeroSection
        artist={artist}
        followerCount={followerCount}
        isFollowing={isFollowing}
        hasBetaAccess={hasBetaAccess}
        onFollow={handleFollow}
        onShare={() => setShowShareModal(true)}
      />

      {/* Main Content Area with Tabs */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="tracks" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 mb-8">
                <TabsTrigger
                  value="tracks"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-6 py-4 text-base"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Tracks
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-6 py-4 text-base"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="merch"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-6 py-4 text-base"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Merch
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 text-base"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* Tracks Tab */}
              <TabsContent value="tracks" className="mt-0">
                {tracks.length === 0 ? (
                  <EmptyStateCard
                    icon={Music}
                    title="No Tracks Yet"
                    description="This artist is working on new music. Follow them to get notified when they release!"
                    ctaText={isFollowing ? "Explore More Artists" : "Follow Artist"}
                    onCtaClick={isFollowing ? undefined : handleFollow}
                    ctaPath={isFollowing ? "/explore" : undefined}
                    variant="gold"
                  />
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <PremiumTrackCard
                        key={track.id}
                        track={track}
                        artistName={artist.artist_name}
                        isLiked={likedTracks[track.id]}
                        onPlay={() => playNow({
                          id: track.id,
                          type: 'track',
                          title: track.title,
                          artistId: artist.id,
                          artistName: artist.artist_name,
                          artistUserId: artist.user_id,
                          mediaUrl: track.audio_url,
                          coverUrl: track.cover_url || undefined,
                        })}
                        onLikeChange={(isLiked) => handleLikeChange(track.id, isLiked)}
                        showCollaborators={true}
                      />
                    ))}
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
              <TabsContent value="about" className="mt-0">
                <ArtistAboutSection artist={artist} />
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

            {/* Achievements Link */}
            <Link to={`/artist/${userId}/achievements`}>
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
      />
    </div>
  );
}
