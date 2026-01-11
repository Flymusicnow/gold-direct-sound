import { useState, useCallback } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Heart, SkipForward, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniAudioPreview } from "@/components/audio/MiniAudioPreview";
import { cn } from "@/lib/utils";

interface SpotlightEntry {
  id: string;
  vote_count: number;
  track: {
    id: string;
    title: string;
    cover_url: string | null;
    audio_url?: string | null;
  } | null;
  artist_profile: {
    id: string;
    artist_name: string;
    avatar_url: string | null;
    user_id?: string;
  } | null;
}

interface SwipeVoteCardProps {
  entry: SpotlightEntry;
  onVote: () => Promise<void>;
  onSkip: () => void;
  hasVoted: boolean;
  currentIndex: number;
  totalEntries: number;
  onPlayFull?: () => void;
}

const SWIPE_THRESHOLD = 80;

export function SwipeVoteCard({
  entry,
  onVote,
  onSkip,
  hasVoted,
  currentIndex,
  totalEntries,
  onPlayFull,
}: SwipeVoteCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const x = useMotionValue(0);
  
  // Transform x position to visual feedback
  const voteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const cardRotation = useTransform(x, [-200, 200], [-10, 10]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD && !hasVoted) {
      // Swipe right - Vote
      setIsVoting(true);
      try {
        await onVote();
      } finally {
        setIsVoting(false);
      }
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe left - Skip
      onSkip();
    }
  }, [hasVoted, onVote, onSkip]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Background hints */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-start pl-8 pointer-events-none"
        style={{ opacity: skipOpacity }}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <SkipForward className="h-8 w-8" />
          <span className="font-semibold">Skip</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none"
        style={{ opacity: voteOpacity }}
      >
        <div className="flex items-center gap-2 text-primary">
          <span className="font-semibold">Vote</span>
          <Heart className="h-8 w-8 fill-primary" />
        </div>
      </motion.div>

      {/* Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{ x, rotate: cardRotation, scale }}
        className={cn(
          "relative touch-pan-y",
          isVoting && "pointer-events-none"
        )}
        whileTap={{ cursor: "grabbing" }}
      >
        <Card className="p-6 bg-card border-border/50 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            {/* Large Cover */}
            <div className="relative">
              {entry.track?.cover_url ? (
                <img
                  src={entry.track.cover_url}
                  alt={entry.track.title}
                  className="w-48 h-48 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg">
                  <Music className="h-16 w-16 text-primary/50" />
                </div>
              )}
              
              {/* Voted overlay */}
              {hasVoted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                >
                  <div className="bg-primary rounded-full p-3">
                    <Heart className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center w-full">
              <h3 className="text-xl font-bold line-clamp-2">
                {entry.track?.title || 'Unknown Track'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {entry.artist_profile?.artist_name || 'Unknown Artist'}
              </p>
            </div>

            {/* Audio Preview */}
            {entry.track?.audio_url && (
              <div className="w-full">
                <MiniAudioPreview
                  audioUrl={entry.track.audio_url}
                  trackId={entry.track.id}
                  title={entry.track.title}
                  artistName={entry.artist_profile?.artist_name || 'Unknown'}
                  artistId={entry.artist_profile?.id || ''}
                  coverUrl={entry.track.cover_url || undefined}
                  onPlayFull={onPlayFull}
                />
              </div>
            )}

            {/* Vote Count */}
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Heart className={cn("h-4 w-4", hasVoted && "fill-primary text-primary")} />
              <span className="font-semibold">{entry.vote_count}</span>
              <span className="text-muted-foreground">votes</span>
            </Badge>

            {/* Swipe Hint */}
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <ChevronLeft className="h-3 w-3" />
              Swipe to skip or vote
              <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: Math.min(totalEntries, 10) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === currentIndex
                ? "bg-primary w-4"
                : i < currentIndex
                  ? "bg-primary/50"
                  : "bg-muted"
            )}
          />
        ))}
        {totalEntries > 10 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{totalEntries - 10}
          </span>
        )}
      </div>

      {/* Manual buttons for accessibility */}
      <div className="flex justify-center gap-4 mt-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onSkip}
          className="gap-2 min-h-[44px]"
        >
          <SkipForward className="h-4 w-4" />
          Skip
        </Button>
        <Button
          size="lg"
          onClick={async () => {
            if (!hasVoted) {
              setIsVoting(true);
              try {
                await onVote();
              } finally {
                setIsVoting(false);
              }
            }
          }}
          disabled={hasVoted || isVoting}
          className="gap-2 min-h-[44px]"
        >
          <Heart className={cn("h-4 w-4", hasVoted && "fill-current")} />
          {hasVoted ? "Voted" : "Vote"}
        </Button>
      </div>
    </div>
  );
}
