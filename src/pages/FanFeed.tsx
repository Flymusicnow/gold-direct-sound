import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackCard } from "@/components/TrackCard";
import { DiscoverArtists } from "@/components/DiscoverArtists";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { TrendingSection } from "@/components/TrendingSection";
import { Music, TrendingUp, Sparkles, Video, Play, ArrowLeft } from "lucide-react";
import { SpotlightTrendingCard } from "@/components/spotlight/SpotlightTrendingCard";
import { SpotlightNewEntryCard } from "@/components/spotlight/SpotlightNewEntryCard";
import { SpotlightRisingCard } from "@/components/spotlight/SpotlightRisingCard";
import { UpcomingEventsCard } from "@/components/feed/UpcomingEventsCard";
import SpotlightRankMilestoneCard from "@/components/spotlight/SpotlightRankMilestoneCard";
import { VideoPostCard } from "@/components/feed/VideoPostCard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";

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
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export default function FanFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playNow, addToQueue, setQueue } = useFlightdeck();
  const [newTracks, setNewTracks] = useState<NewTrack[]>([]);
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [followedGenres, setFollowedGenres] = useState<string[]>([]);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

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
    toast.success(`Playing ${newTracks.length} tracks`);
  };

  const handlePlayTrack = (track: NewTrack) => {
    const item = trackToFlightdeckItem(track);
    const context = newTracks.map(trackToFlightdeckItem);
    playNow(item, context);
  };

  const handleAddToQueue = (track: NewTrack) => {
    addToQueue(trackToFlightdeckItem(track));
    toast.success(`"${track.title}" added to queue`);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFeedData();
  }, [user, navigate]);

  const fetchFeedData = async () => {
    if (!user) return;

    try {
      // Fetch followed artists
      const { data: follows } = await supabase
        .from('follows')
        .select(`
          artist_id,
          artist_profiles (
            id,
            genre
          )
        `)
        .eq('fan_id', user.id);

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
          .limit(10);

        setNewTracks(tracksData || []);

        // Fetch video posts from followed artists
        const { data: videosData } = await supabase
          .from('artist_video_posts')
          .select(`
            id,
            video_url,
            caption,
            created_at,
            artist_profiles (
              id,
              user_id,
              artist_name,
              avatar_url
            )
          `)
          .in('artist_id', artistIds)
          .order('created_at', { ascending: false })
          .limit(10);

        setVideoPosts(videosData || []);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your feed...</p>
      </div>
    );
  }

  return (
    <>
      <MobileFanNav />
      <div className="min-h-screen py-24 px-4 pb-44 md:pb-28">
        <div className="container mx-auto max-w-7xl space-y-6 md:space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/fan")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Your Feed</h1>
          <p className="text-muted-foreground">Discover what's new from your favorite artists</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* New From Your Artists */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Music className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">New From Your Artists</h2>
                <InfoTooltip
                  title="Latest From Followed"
                  description="Newest tracks from artists you follow, sorted by release date. Follow more artists to see more content here."
                  forRole="fan"
                />
              </div>

              {newTracks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No new tracks yet. Start following artists to see their latest releases!
                  </p>
                  <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
                    Discover Artists
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Play All Button */}
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handlePlayAll}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play All ({newTracks.length})
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {newTracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        artistName={track.artist_profiles.artist_name}
                        isLiked={likedTrackIds.has(track.id)}
                        onPlay={() => handlePlayTrack(track)}
                        onAddToQueue={() => handleAddToQueue(track)}
                        onLikeChange={(isLiked) => handleLikeChange(track.id, isLiked)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Video Posts */}
            {videoPosts.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Video className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">New Videos From Your Artists</h2>
                </div>
                <div className="space-y-6">
                  {videoPosts.map((video) => (
                    <VideoPostCard
                      key={video.id}
                      videoId={video.id}
                      videoUrl={video.video_url}
                      caption={video.caption}
                      createdAt={video.created_at}
                      artist={video.artist_profiles}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Upcoming Events */}
            <UpcomingEventsCard followedArtistIds={followedArtistIds} />

            {/* Trending in Spotlight */}
            <SpotlightTrendingCard
              onPlayTrack={(url, title, artist, cover) => playNow({
                id: `spotlight-${url}`,
                type: 'track',
                title,
                artistId: '',
                artistName: artist,
                artistUserId: '',
                mediaUrl: url,
                coverUrl: cover,
              })}
            />

            {/* Recommended For You */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Recommended For You</h2>
              </div>

              <DiscoverArtists
                followedGenres={followedGenres}
                followedArtistIds={followedArtistIds}
                limit={6}
              />
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Your Artists in Top 10 */}
            <SpotlightRankMilestoneCard />

            {/* Spotlight New Entries */}
            <SpotlightNewEntryCard
              onPlayTrack={(url, title, artist, cover) => playNow({
                id: `spotlight-new-${url}`,
                type: 'track',
                title,
                artistId: '',
                artistName: artist,
                artistUserId: '',
                mediaUrl: url,
                coverUrl: cover,
              })}
            />

            {/* Your Artists Are Rising */}
            <SpotlightRisingCard />

            {/* Trending on FlyMusic */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Trending</h2>
                <InfoTooltip
                  title="Trending Content"
                  description="Top tracks based on plays, likes, shares, and Spotlight votes in the last 48 hours."
                  forRole="fan"
                />
              </div>

              <TrendingSection
                type="tracks"
                limit={10}
                onTrackPlay={(item) => playNow(item)}
              />
            </Card>
          </div>
        </div>
        </div>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
