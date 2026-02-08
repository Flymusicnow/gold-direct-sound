import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Play, Pause, Music, ListMusic, Lock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AddToPlaylistDialog from "@/components/playlists/AddToPlaylistDialog";
import { CollaboratorBadge } from "./CollaboratorBadge";
import { useSupporterAccess } from "@/hooks/useSupporterAccess";
import { BecomeASupporterModal } from "@/components/supporter/BecomeASupporterModal";
import { SupporterExclusiveBadge } from "@/components/supporter/SupporterExclusiveBadge";
import { useFlightdeck } from "@/contexts/FlightdeckContext";
import { VerifiedBadge } from "./VerifiedBadge";

interface PremiumTrackCardProps {
  track: {
    id: string;
    title: string;
    description?: string | null;
    genre?: string | null;
    audio_url: string;
    cover_url?: string | null;
    play_count?: number;
    artist_id: string;
    is_supporter_only?: boolean;
    required_tier?: string | null;
  };
  artistName: string;
  artistUserId?: string;
  isLiked?: boolean;
  onPlay: () => void;
  onAddToQueue?: () => void;
  onLikeChange?: (isLiked: boolean) => void;
  showCollaborators?: boolean;
}

export function PremiumTrackCard({
  track,
  artistName,
  artistUserId,
  isLiked = false,
  onPlay,
  onAddToQueue,
  onLikeChange,
  showCollaborators = false,
}: PremiumTrackCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [isUpdating, setIsUpdating] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
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
  const { hasAccess, loading: accessLoading } = useSupporterAccess(
    track.artist_id,
    track.is_supporter_only ? track.required_tier : null
  );

  useEffect(() => {
    if (showCollaborators) {
      fetchCollaborators();
    }
  }, [track.id, showCollaborators]);

  const fetchCollaborators = async () => {
    try {
      const { data } = await supabase
        .from("track_collaborators")
        .select("*")
        .eq("track_id", track.id)
        .eq("status", "accepted");

      if (data && data.length > 0) {
        const collabIds = data.map(c => c.collaborator_artist_id);
        const { data: profiles } = await supabase
          .from("artist_profiles")
          .select("id, artist_name")
          .in("id", collabIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const collabsWithProfiles = data.map(collab => ({
          ...collab,
          artist_profiles: profileMap.get(collab.collaborator_artist_id),
        }));

        setCollaborators(collabsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    }
  };

  const { currentItem, isPlaying, togglePlay } = useFlightdeck();

  // Check if this track is currently playing
  const isCurrentlyPlaying = currentItem?.id === track.id && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.is_supporter_only && !hasAccess) {
      setShowSupporterModal(true);
      return;
    }
    // If this track is currently playing, toggle pause/play
    if (isCurrentlyPlaying) {
      togglePlay();
    } else {
      onPlay();
    }
  };

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
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("track_id", track.id);
        setLiked(false);
        onLikeChange?.(false);
        toast.success("Removed from liked tracks");
      } else {
        await supabase
          .from("likes")
          .insert({ user_id: user.id, track_id: track.id });
        setLiked(true);
        onLikeChange?.(true);
        toast.success("Added to liked tracks");
      }
    } catch (error) {
      console.error("Error updating like:", error);
      toast.error("Failed to update like");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className="group p-4 rounded-xl bg-card/50 border border-border/50 interactive-card list-row-premium cursor-pointer"
        onClick={handlePlay}
      >
        <div className="flex items-center gap-4">
          {/* Cover Art with clickable play overlay */}
          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={track.title}
                className={`w-full h-full object-cover ${track.is_supporter_only && !hasAccess ? "blur-sm" : ""}`}
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <Music className="h-8 w-8 text-primary" />
              </div>
            )}
            
            {/* Locked Overlay on Cover */}
            {track.is_supporter_only && !hasAccess && !accessLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            )}
            
            {/* Play Overlay - Clickable */}
            {(!track.is_supporter_only || hasAccess) && (
        <div 
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={handlePlay}
        >
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: 'hsl(45, 82%, 51%)',
              border: '1px solid hsla(45, 82%, 51%, 0.4)',
              boxShadow: '0 4px 12px hsla(45, 82%, 51%, 0.35)'
            }}
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-6 w-6 fill-white text-white" />
            ) : (
              <Play className="h-6 w-6 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{track.title}</h3>
              {track.is_supporter_only && track.required_tier && (
                <SupporterExclusiveBadge tier={track.required_tier as "basic" | "gold"} className="flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
              {artistName}
              {isVerified && <VerifiedBadge size="sm" />}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {track.genre && (
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                  {track.genre}
                </Badge>
              )}
              {showCollaborators && collaborators.length > 0 && (
                <CollaboratorBadge collaborators={collaborators} />
              )}
            </div>
            {track.description && (
              <p className="text-xs text-muted-foreground/70 truncate mt-1">
                {track.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {track.is_supporter_only && !hasAccess && !accessLoading ? (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSupporterModal(true);
                }}
                className="bg-gradient-gold hover:opacity-90"
              >
                Unlock
              </Button>
            ) : (
              <>
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
                  disabled={accessLoading}
                >
                  <ListMusic className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                  onClick={handleLike}
                  disabled={isUpdating || accessLoading}
                >
                  <Heart
                    className={`h-5 w-5 ${liked ? "fill-primary text-primary" : ""}`}
                  />
                </Button>
                <button
                  onClick={handlePlay}
                  disabled={accessLoading}
                  title={isCurrentlyPlaying ? "Pause" : "Play now"}
                  className="h-9 w-9 rounded-full flex items-center justify-center disabled:opacity-50 transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'hsl(45, 82%, 51%)',
                    border: '1px solid hsla(45, 82%, 51%, 0.4)',
                    boxShadow: '0 4px 12px hsla(45, 82%, 51%, 0.35)'
                  }}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-5 w-5 fill-white text-white" />
                  ) : (
                    <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                  )}
                </button>
                {onAddToQueue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.is_supporter_only && !hasAccess) {
                        setShowSupporterModal(true);
                        return;
                      }
                      onAddToQueue();
                      toast.success(`"${track.title}" added to queue`);
                    }}
                    disabled={accessLoading}
                    title="Add to queue"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {user && (
        <>
          <AddToPlaylistDialog
            isOpen={playlistDialogOpen}
            onClose={() => setPlaylistDialogOpen(false)}
            trackId={track.id}
            trackTitle={track.title}
          />
          <BecomeASupporterModal
            open={showSupporterModal}
            onOpenChange={setShowSupporterModal}
            artistId={track.artist_id}
            artistName={artistName}
          />
        </>
      )}
    </>
  );
}