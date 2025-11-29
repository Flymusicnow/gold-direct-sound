import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useFlightdeck } from "@/contexts/FlightdeckContext";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Play,
  Trash2,
  Share2,
  Lock,
  Globe,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Track {
  id: string;
  track_id: string;
  tracks: {
    id: string;
    title: string;
    audio_url: string;
    cover_url: string | null;
    artist_profiles: {
      artist_name: string;
      user_id: string;
    };
  };
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
}

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { user } = useAuth();
  const { playNow } = useFlightdeck();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!playlistId) return;
    fetchPlaylistData();
  }, [playlistId]);

  const fetchPlaylistData = async () => {
    if (!playlistId) return;

    try {
      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .maybeSingle();

      if (playlistError) throw playlistError;
      if (!playlistData) {
        toast.error("Playlist not found");
        navigate("/fan/playlists");
        return;
      }

      setPlaylist(playlistData);

      // Fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from("playlist_tracks")
        .select(
          `
          id,
          track_id,
          tracks (
            id,
            title,
            audio_url,
            cover_url,
            artist_profiles (
              artist_name,
              user_id
            )
          )
        `
        )
        .eq("playlist_id", playlistId)
        .order("added_at", { ascending: false });

      if (tracksError) throw tracksError;
      setTracks((tracksData as any) || []);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      toast.error("Failed to load playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("id", trackId);

      if (error) throw error;

      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      toast.success("Track removed from playlist");
    } catch (error) {
      console.error("Error removing track:", error);
      toast.error("Failed to remove track");
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/playlist/${playlistId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Playlist link copied to clipboard!");
  };

  const isOwner = user && playlist && user.id === playlist.user_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  return (
    <>
      <MobileFanNav />
      <div className="min-h-screen py-24 px-4 pb-32 md:pb-28">
        <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/fan/playlists")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playlists
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-muted-foreground">{playlist.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {playlist.is_public ? (
                <Globe className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              {playlist.is_public && (
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/fan/playlists/${playlistId}/settings`)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
          </p>
        </div>

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              This playlist is empty
            </p>
            <Button onClick={() => navigate("/explore")}>
              Explore Music
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <Card
                key={track.id}
                className="p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  {track.tracks.cover_url ? (
                    <img
                      src={track.tracks.cover_url}
                      alt={track.tracks.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                      <Play className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {track.tracks.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {track.tracks.artist_profiles.artist_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => playNow({
                        id: track.tracks.id,
                        type: 'track',
                        title: track.tracks.title,
                        artistId: '',
                        artistName: track.tracks.artist_profiles.artist_name,
                        artistUserId: track.tracks.artist_profiles.user_id,
                        mediaUrl: track.tracks.audio_url,
                        coverUrl: track.tracks.cover_url || undefined,
                      })}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveTrack(track.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
