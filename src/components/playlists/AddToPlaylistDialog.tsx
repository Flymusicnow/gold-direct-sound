import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Check, ListMusic, Pin } from "lucide-react";
import { toast } from "sonner";
import CreatePlaylistDialog from "./CreatePlaylistDialog";

interface Playlist {
  id: string;
  name: string;
  has_track: boolean;
  is_pinned: boolean;
  updated_at: string;
}

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

export default function AddToPlaylistDialog({
  isOpen,
  onClose,
  trackId,
  trackTitle,
}: AddToPlaylistDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchPlaylists();
    }
  }, [isOpen, user, trackId]);

  const fetchPlaylists = async () => {
    if (!user) return;

    try {
      // Get user's playlists - sorted by updated_at to show recently used first
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select("id, name, is_pinned, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (playlistsError) throw playlistsError;

      // Check which playlists already have this track
      const { data: existingTracks, error: tracksError } = await supabase
        .from("playlist_tracks")
        .select("playlist_id")
        .eq("track_id", trackId);

      if (tracksError) throw tracksError;

      const existingPlaylistIds = new Set(
        existingTracks?.map((t) => t.playlist_id) || []
      );

      const enrichedPlaylists = (playlistsData || []).map((p: any) => ({
        ...p,
        has_track: existingPlaylistIds.has(p.id),
        is_pinned: p.is_pinned || false,
      }));

      // Sort: pinned first, then by updated_at
      enrichedPlaylists.sort((a: Playlist, b: Playlist) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      setPlaylists(enrichedPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to load playlists");
    }
  };

  const handleToggleTrack = async (playlistId: string, hasTrack: boolean) => {
    try {
      setLoading(true);

      if (hasTrack) {
        // Remove from playlist
        const { error } = await supabase
          .from("playlist_tracks")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("track_id", trackId);

        if (error) throw error;
        toast.success("Removed from playlist");
      } else {
        // Add to playlist
        const { error } = await supabase.from("playlist_tracks").insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: 0,
        });

        if (error) throw error;
        toast.success("Added to playlist");
      }

      fetchPlaylists();
    } catch (error) {
      console.error("Error toggling track in playlist:", error);
      toast.error("Failed to update playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>
              Add "{trackTitle}" to your playlists
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Action buttons row */}
            <div className="flex gap-2 pb-2 border-b border-border mb-2">
              <Button
                variant="outline"
                className="flex-1 justify-start"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onClose();
                  navigate('/fan/stacks');
                }}
              >
                <ListMusic className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No playlists yet</p>
                <p className="text-sm">Create your first playlist above</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <Button
                  key={playlist.id}
                  variant={playlist.has_track ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() =>
                    handleToggleTrack(playlist.id, playlist.has_track)
                  }
                  disabled={loading}
                >
                  <span className="flex items-center gap-1">
                    {playlist.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    {playlist.name}
                  </span>
                  {playlist.has_track && <Check className="h-4 w-4" />}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlaylistDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchPlaylists}
      />
    </>
  );
}
