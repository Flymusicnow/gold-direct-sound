import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Heart, Play, Instagram, Twitter, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  twitter_url: string | null;
  website_url: string | null;
}

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  play_count: number;
}

export default function ArtistProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchArtist();
      fetchTracks();
      checkFollowStatus();
    }
  }, [userId]);

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
    <div className="min-h-screen pb-32">
      {/* Artist Header */}
      <div className="bg-gradient-dark border-b border-border">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {artist.avatar_url ? (
              <img
                src={artist.avatar_url}
                alt={artist.artist_name}
                className="w-40 h-40 rounded-full object-cover"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-6xl text-primary font-bold">
                  {artist.artist_name[0]}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{artist.artist_name}</h1>
              {artist.genre && (
                <p className="text-primary mb-4">{artist.genre}</p>
              )}
              {artist.bio && (
                <p className="text-muted-foreground mb-6">{artist.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className={!isFollowing ? "bg-gradient-gold" : ""}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                  {isFollowing ? "Following" : "Follow"}
                </Button>

                {artist.instagram_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                {artist.twitter_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={artist.twitter_url} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                {artist.website_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={artist.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">Tracks</h2>
        
        {tracks.length === 0 ? (
          <p className="text-muted-foreground">No tracks yet.</p>
        ) : (
          <div className="space-y-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => setCurrentTrack(track)}
              >
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{track.title}</h3>
                  {track.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {track.description}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTrack(track);
                  }}
                >
                  <Play className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {currentTrack && (
        <AudioPlayer
          audioUrl={currentTrack.audio_url}
          title={currentTrack.title}
          artistName={artist.artist_name}
          coverUrl={currentTrack.cover_url || undefined}
        />
      )}
    </div>
  );
}
