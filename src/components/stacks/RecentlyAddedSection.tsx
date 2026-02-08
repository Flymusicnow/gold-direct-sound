import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFlightdeck, FlightdeckItem } from '@/contexts/FlightdeckContext';
import { Button } from '@/components/ui/button';
import { Clock, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface RecentTrack {
  id: string;
  added_at: string;
  track_id: string;
  playlist_id: string;
  track: {
    id: string;
    title: string;
    cover_url: string | null;
    audio_url: string;
    artist_id: string;
    artist_profile: {
      artist_name: string;
      user_id: string;
    } | null;
  };
  playlist: {
    name: string;
  };
}

export function RecentlyAddedSection() {
  const { user } = useAuth();
  const { playNow } = useFlightdeck();
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentlyAdded();
    }
  }, [user]);

  const fetchRecentlyAdded = async () => {
    if (!user) return;

    try {
      // First get user's playlist IDs
      const { data: userPlaylists } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id);

      if (!userPlaylists || userPlaylists.length === 0) {
        setRecentTracks([]);
        setLoading(false);
        return;
      }

      const playlistIds = userPlaylists.map(p => p.id);

      // Get recent tracks from those playlists
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(`
          id,
          added_at,
          track_id,
          playlist_id,
          tracks (
            id,
            title,
            cover_url,
            audio_url,
            artist_id,
            artist_profiles!tracks_artist_id_fkey (
              artist_name,
              user_id
            )
          ),
          playlists!inner (
            name
          )
        `)
        .in('playlist_id', playlistIds)
        .order('added_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform data to our interface
      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        added_at: item.added_at,
        track_id: item.track_id,
        playlist_id: item.playlist_id,
        track: {
          id: item.tracks.id,
          title: item.tracks.title,
          cover_url: item.tracks.cover_url,
          audio_url: item.tracks.audio_url,
          artist_id: item.tracks.artist_id,
          artist_profile: item.tracks.artist_profiles,
        },
        playlist: {
          name: item.playlists.name,
        },
      }));

      setRecentTracks(transformed);
    } catch (error) {
      console.error('Error fetching recently added:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (item: RecentTrack) => {
    if (!item.track.artist_profile) return;

    const flightdeckItem: FlightdeckItem = {
      id: item.track.id,
      type: 'track',
      title: item.track.title,
      artistId: item.track.artist_id,
      artistName: item.track.artist_profile.artist_name,
      artistUserId: item.track.artist_profile.user_id,
      mediaUrl: item.track.audio_url,
      coverUrl: item.track.cover_url || undefined,
    };

    playNow(flightdeckItem);
  };

  const handleRemoveFromPlaylist = async (item: RecentTrack) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setRecentTracks(prev => prev.filter(t => t.id !== item.id));
      toast.success('Removed from playlist');
    } catch (error) {
      console.error('Error removing track:', error);
      toast.error('Failed to remove track');
    }
  };

  if (loading || recentTracks.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Recently Added
      </h2>
      <div className="space-y-2">
        {recentTracks.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors group"
          >
            <div className="relative overflow-hidden rounded isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
              <img
                src={item.track.cover_url || '/placeholder.svg'}
                alt={item.track.title}
                className="w-12 h-12 rounded object-cover"
              />
              <button
                onClick={() => handlePlayTrack(item)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
              >
                <Play className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.track.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {item.track.artist_profile?.artist_name || 'Unknown Artist'} · Added to {item.playlist.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.added_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handlePlayTrack(item)}
                className="h-8 w-8"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveFromPlaylist(item)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
