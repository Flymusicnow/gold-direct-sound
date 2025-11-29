import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus, ListMusic } from "lucide-react";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import CreatePlaylistDialog from "@/components/playlists/CreatePlaylistDialog";
import { toast } from "sonner";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  track_count: number;
}

export default function FanPlaylists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlaylists();
  }, [user, navigate]);

  const fetchPlaylists = async () => {
    if (!user) return;

    try {
      const { data: playlistsData, error } = await supabase
        .from("playlists")
        .select("id, name, description, is_public, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get track count for each playlist
      const playlistsWithCounts = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from("playlist_tracks")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);

          return {
            ...playlist,
            track_count: count || 0,
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading playlists...</p>
      </div>
    );
  }

  return (
    <>
      <MobileFanNav />
      <div className="min-h-screen py-24 px-4 pb-20 md:pb-4">
        <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <ListMusic className="h-10 w-10 text-primary" />
              My Playlists
            </h1>
            <p className="text-muted-foreground">
              Organize your favorite tracks into custom playlists
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <ListMusic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first playlist to organize your favorite tracks
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                id={playlist.id}
                name={playlist.name}
                description={playlist.description}
                isPublic={playlist.is_public}
                trackCount={playlist.track_count}
              />
            ))}
          </div>
        )}
        </div>

        <CreatePlaylistDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={fetchPlaylists}
        />
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
