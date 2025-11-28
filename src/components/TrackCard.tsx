import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Play, Music, ListMusic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AddToPlaylistDialog from "@/components/playlists/AddToPlaylistDialog";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    description?: string | null;
    audio_url: string;
    cover_url?: string | null;
  };
  artistName: string;
  isLiked?: boolean;
  onPlay: () => void;
  onLikeChange?: (isLiked: boolean) => void;
  showLikeButton?: boolean;
}

export function TrackCard({ 
  track, 
  artistName, 
  isLiked = false, 
  onPlay, 
  onLikeChange,
  showLikeButton = true 
}: TrackCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [isUpdating, setIsUpdating] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to like tracks");
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', track.id);
        setLiked(false);
        onLikeChange?.(false);
        toast.success("Removed from liked tracks");
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: track.id });
        setLiked(true);
        onLikeChange?.(true);
        toast.success("Added to liked tracks");
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error("Failed to update like");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className="group flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer"
        onClick={onPlay}
      >
      <div className="relative w-16 h-16 flex-shrink-0">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="w-full h-full rounded object-cover"
          />
        ) : (
          <div className="w-full h-full rounded bg-primary/10 flex items-center justify-center">
            <Music className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-8 w-8 text-primary fill-primary" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{artistName}</p>
        {track.description && (
          <p className="text-xs text-muted-foreground/70 truncate mt-1">
            {track.description}
          </p>
        )}
      </div>

      {showLikeButton && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                toast.error("Please sign in to add to playlist");
                return;
              }
              setPlaylistDialogOpen(true);
            }}
          >
            <ListMusic className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleLike}
            disabled={isUpdating}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-primary text-primary" : ""}`} />
          </Button>
        </>
      )}
      </div>
      {user && (
        <AddToPlaylistDialog
          isOpen={playlistDialogOpen}
          onClose={() => setPlaylistDialogOpen(false)}
          trackId={track.id}
          trackTitle={track.title}
        />
      )}
    </>
  );
}
