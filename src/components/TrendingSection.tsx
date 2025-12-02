import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Music, TrendingUp } from "lucide-react";

interface TrendingTrack {
  id: string;
  title: string;
  cover_url: string | null;
  audio_url: string;
  play_count: number;
  artist_profiles: {
    id: string;
    artist_name: string;
    user_id: string;
    avatar_url: string | null;
  };
}

interface TrendingArtist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  follower_count: number;
}

interface TrendingSectionProps {
  type: 'tracks' | 'artists';
  limit?: number;
  onTrackPlay?: (item: {
    id: string;
    type: 'track';
    title: string;
    artistId: string;
    artistName: string;
    artistUserId: string;
    artistAvatar?: string;
    coverUrl?: string;
    mediaUrl: string;
  }) => void;
}

export function TrendingSection({ type, limit = 5, onTrackPlay }: TrendingSectionProps) {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<TrendingTrack[]>([]);
  const [artists, setArtists] = useState<TrendingArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'tracks') {
      fetchTrendingTracks();
    } else {
      fetchTrendingArtists();
    }
  }, [type, limit]);

  const fetchTrendingTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          cover_url,
          audio_url,
          play_count,
          artist_profiles (
            id,
            artist_name,
            user_id,
            avatar_url
          )
        `)
        .order('play_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingArtists = async () => {
    try {
      // Get all artists with follower counts
      const { data: artistsData, error: artistsError } = await supabase
        .from('artist_profiles')
        .select('id, user_id, artist_name, avatar_url, genre')
        .eq('status', 'approved');

      if (artistsError) throw artistsError;

      // Get follower counts for each artist
      const artistsWithCounts = await Promise.all(
        (artistsData || []).map(async (artist) => {
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artist.id);

          return {
            ...artist,
            follower_count: count || 0
          };
        })
      );

      // Sort by follower count and limit
      const sorted = artistsWithCounts
        .sort((a, b) => b.follower_count - a.follower_count)
        .slice(0, limit);

      setArtists(sorted);
    } catch (error) {
      console.error('Error fetching trending artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading trending...</p>;
  }

  if (type === 'tracks') {
    if (tracks.length === 0) {
      return <p className="text-muted-foreground">No trending tracks yet</p>;
    }

    return (
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            onClick={() => {
              if (onTrackPlay) {
                onTrackPlay({
                  id: track.id,
                  type: 'track',
                  title: track.title,
                  artistId: track.artist_profiles.id,
                  artistName: track.artist_profiles.artist_name,
                  artistUserId: track.artist_profiles.user_id,
                  artistAvatar: track.artist_profiles.avatar_url || undefined,
                  coverUrl: track.cover_url || undefined,
                  mediaUrl: track.audio_url,
                });
              }
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
              <span className="text-sm font-bold text-primary">{index + 1}</span>
            </div>

            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={track.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                <Music className="h-6 w-6 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{track.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist_profiles.artist_name}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {track.play_count}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (artists.length === 0) {
    return <p className="text-muted-foreground">No trending artists yet</p>;
  }

  return (
    <div className="space-y-2">
      {artists.map((artist, index) => (
        <div
          key={artist.id}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
          onClick={() => navigate(`/artist/${artist.user_id}`)}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
            <span className="text-sm font-bold text-primary">{index + 1}</span>
          </div>

          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={artist.artist_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg text-primary font-bold">
                {artist.artist_name[0]}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{artist.artist_name}</h3>
            {artist.genre && (
              <p className="text-sm text-muted-foreground truncate">{artist.genre}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {artist.follower_count} followers
          </div>
        </div>
      ))}
    </div>
  );
}
