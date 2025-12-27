import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { FlightdeckItem } from "@/contexts/FlightdeckContext";
import { FanActionBar } from "./FanActionBar";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";
import { useFollowArtist } from "@/hooks/useFollowArtist";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ContentOverlayProps {
  item: FlightdeckItem | null;
  items?: FlightdeckItem[];
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  isLiked?: boolean;
  isFollowing?: boolean;
  hasVoted?: boolean;
}

export function ContentOverlay({
  item,
  items,
  currentIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
  isLiked = false,
  isFollowing = false,
  hasVoted = false,
}: ContentOverlayProps) {
  const [direction, setDirection] = useState(0);
  const [dragDirection, setDragDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const { isFollowing: following, toggleFollow } = useFollowArtist(
    item?.artistId || '',
    isFollowing
  );

  if (!item) return null;

  const canGoNext = items && currentIndex < items.length - 1;
  const canGoPrev = items && currentIndex > 0;

  const handleNext = () => {
    if (canGoNext && onIndexChange) {
      setDirection(1);
      onIndexChange(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev && onIndexChange) {
      setDirection(-1);
      onIndexChange(currentIndex - 1);
    }
  };

  const handleDragStart = (_: any, info: PanInfo) => {
    const { offset } = info;
    if (Math.abs(offset.y) > Math.abs(offset.x)) {
      setDragDirection('vertical');
    } else if (Math.abs(offset.x) > 10) {
      setDragDirection('horizontal');
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (dragDirection === 'vertical' && (offset.y > 100 || velocity.y > 500)) {
      onClose();
    } else if (dragDirection === 'horizontal' && items) {
      if (offset.x < -80 && canGoNext) {
        handleNext();
      } else if (offset.x > 80 && canGoPrev) {
        handlePrev();
      }
    }
    
    setDragDirection(null);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-sm">
        {/* Header with Close */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-background/80 to-transparent">
          <div className="flex items-center gap-2">
            {canGoPrev && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="hover:bg-primary/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-primary/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Next Button */}
        {canGoNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hover:bg-primary/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Content */}
        <motion.div
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="h-full overflow-y-auto p-6 pt-20"
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={item.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="space-y-6"
            >
              {/* Media Container with Gold Glow */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_40px_rgba(232,191,26,0.2)]">
                {item.type === 'track' ? (
                  // Track Cover
                  <div className="aspect-video bg-card flex items-center justify-center">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-primary text-6xl">🎵</div>
                    )}
                  </div>
                ) : (
                  // Video Player
                  <PremiumVideoPlayer
                    videoUrl={item.mediaUrl}
                    showFrame={false}
                  />
                )}
              </div>

              {/* Artist Header */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/30">
                    <AvatarImage src={item.artistAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {item.artistName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{item.artistName}</p>
                    <p className="text-sm text-muted-foreground">Artist</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={following ? 'outline' : 'default'}
                    size="sm"
                    onClick={toggleFollow}
                    className="transition-all hover:scale-105"
                  >
                    {following ? 'Following' : 'Follow'}
                  </Button>
                  <InfoTooltip
                    title="Why Follow?"
                    description="Stay updated on new releases, support the artist (+8 XP), and see their content in your feed."
                    forRole="fan"
                    learnLink="/learn?tab=fan#support-artists"
                  />
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{item.title}</h2>
                {item.description && (
                  <p className="text-muted-foreground">{item.description}</p>
                )}
              </div>

              {/* Fan Action Bar */}
              <div className="p-4 rounded-xl bg-card border border-primary/20">
                <FanActionBar
                  item={item}
                  variant="horizontal"
                  showLabels={true}
                  isLiked={isLiked}
                  isFollowing={following}
                  hasVoted={hasVoted}
                />
              </div>

              {/* Queue Position Indicator */}
              {items && items.length > 1 && (
                <div className="text-center text-sm text-muted-foreground">
                  {currentIndex + 1} / {items.length}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
