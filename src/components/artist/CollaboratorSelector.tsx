import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Loader2 } from "lucide-react";

interface Artist {
  id: string;
  artist_name: string;
  avatar_url: string | null;
}

interface CollaboratorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  onSuccess: () => void;
}

export function CollaboratorSelector({
  open,
  onOpenChange,
  trackId,
  onSuccess,
}: CollaboratorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchArtists();
    } else {
      setArtists([]);
    }
  }, [searchQuery]);

  const searchArtists = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's artist profile
      const { data: myProfile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("artist_profiles")
        .select("id, artist_name, avatar_url")
        .ilike("artist_name", `%${searchQuery}%`)
        .eq("status", "approved")
        .neq("id", myProfile?.id || "")
        .limit(10);

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Error searching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (artistId: string, role: string = "featured") => {
    setInviting(artistId);
    try {
      const { error } = await supabase.from("track_collaborators").insert({
        track_id: trackId,
        collaborator_artist_id: artistId,
        role: role,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: "The artist will be notified of your collaboration request",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error inviting collaborator:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Collaborator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists..."
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {!loading && searchQuery.length >= 2 && artists.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No artists found
              </p>
            )}

            {!loading && artists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.artist_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {artist.artist_name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{artist.artist_name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleInvite(artist.id)}
                  disabled={inviting === artist.id}
                  className="gap-2"
                >
                  {inviting === artist.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Invite
                </Button>
              </div>
            ))}
          </div>

          {searchQuery.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Type at least 2 characters to search for artists
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
