import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Play, Music, ListMusic, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AddToPlaylistDialog from "@/components/playlists/AddToPlaylistDialog";
import { VerifiedBadge } from "@/components/artist/VerifiedBadge";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    description?: string | null;
    audio_url: string;
    cover_url?: string | null;
  };
  artistName: string;
  artistUserId?: string;
  isLiked?: boolean;
  onPlay: () => void;
  onAddToQueue?: () => void;
  onLikeChange?: (isLiked: boolean) => void;
  showLikeButton?: boolean;
}

export function TrackCard({ 
  track, 
  artistName,
  artistUserId,
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
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (artistUserId) {
      const checkVerification = async () => {
        const { data } = await supabase
          .from('artist_verifications')
          .select('verification_status')
          .eq('user_id', artistUserId)
          .maybeSingle();
        setIsVerified(data?.verification_status === 'verified');
      };
      checkVerification();
    }
  }, [artistUserId]);

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
        className="group flex items-center gap-3 md:gap-4 px-3 py-3 md:p-4 min-h-[88px] md:min-h-0 rounded-[14px] bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer w-full overflow-hidden"
        onClick={onPlay}
      >
      <div
        className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg isolate"
        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
      >
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <Music className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div 
            className="h-8 w-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'hsl(45, 82%, 51%)',
              border: '1px solid hsla(45, 82%, 51%, 0.4)',
              boxShadow: '0 4px 12px hsla(45, 82%, 51%, 0.35)'
            }}
          >
            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-base md:text-sm font-bold truncate">{track.title}</h3>
        <div className="flex items-center gap-1">
          <p className="text-[13px] md:text-xs text-muted-foreground truncate opacity-80">{artistName}</p>
          {isVerified && <VerifiedBadge size="sm" />}
        </div>
        {track.description && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5 hidden md:block">
            {track.description}
          </p>
        )}
      </div>

      {showLikeButton && (
        <div className="flex items-center gap-1.5 md:gap-2.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
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
              className="hidden md:flex h-9 w-9 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
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
            className="h-9 w-9 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
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
