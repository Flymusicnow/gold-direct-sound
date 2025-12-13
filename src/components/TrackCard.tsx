import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Play, Music, ListMusic, Plus } from "lucide-react";
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
  onAddToQueue?: () => void;
  onLikeChange?: (isLiked: boolean) => void;
  showLikeButton?: boolean;
}

export function TrackCard({ 
  track, 
  artistName, 
  isLiked = false, 
  onPlay,
  onAddToQueue,
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
        {/* Play button overlay - always shows gold play button */}
        <div className="absolute inset-0 rounded bg-black/40 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/90 to-primary/70 border border-primary/40 shadow-lg shadow-primary/20 flex items-center justify-center">
            <Play className="h-4 w-4 text-primary-foreground fill-current ml-0.5" />
          </div>
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                toast.error("Please sign in to add to playlist");
                return;
              }
              setPlaylistDialogOpen(true);
            }}
            title="Add to playlist"
          >
            <ListMusic className="h-5 w-5" />
          </Button>
          {onAddToQueue && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue();
              }}
              title="Add to queue"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
            onClick={handleLike}
            disabled={isUpdating}
            title={liked ? "Unlike" : "Like"}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-primary text-primary" : ""}`} />
          </Button>
        </div>
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
