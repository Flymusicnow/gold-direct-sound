import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { VideoCommentsSection } from "./VideoCommentsSection";

interface VideoCommentSheetProps {
  videoId: string;
  artistId: string;
  onOpenChange?: (open: boolean) => void;
}

export function VideoCommentSheet({
  videoId,
  artistId,
  onOpenChange,
}: VideoCommentSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch comment count
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("video_comments")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId);
      setCommentCount(count ?? 0);
    };
    fetchCount();

    // Real-time count updates
    const channel = supabase
      .channel(`comment_count_${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_comments",
          filter: `video_id=eq.${videoId}`,
        },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleTrigger = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      open();
    },
    [open]
  );

  const handleBackdropTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      close();
    },
    [close]
  );

  // Swipe-down to close
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 60 || info.velocity.y > 300) {
        close();
      }
    },
    [close]
  );

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <>
      {/* Trigger button — part of the right action bar */}
      <button
        onClick={handleTrigger}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleTrigger(e);
        }}
        className="flex flex-col items-center gap-1 touch-manipulation"
        aria-label="Comments"
      >
        <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        {commentCount > 0 && (
          <span className="text-white text-xs font-medium">
            {formatCount(commentCount)}
          </span>
        )}
      </button>

      {/* Bottom sheet overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="comment-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] bg-black/50"
              onClick={handleBackdropTap}
              onTouchEnd={(e) => {
                e.stopPropagation();
                close();
              }}
            />

            {/* Panel */}
            <motion.div
              key="comment-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
              onClick={(e) => e.stopPropagation()}
              className="fixed bottom-0 left-0 right-0 z-[130] rounded-t-2xl bg-card/95 backdrop-blur-xl border-t border-border/30"
              style={{
                maxHeight: "55dvh",
                touchAction: "none",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Comments{commentCount > 0 ? ` (${commentCount})` : ""}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                  }}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center touch-manipulation"
                  aria-label="Close comments"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable comments area */}
              <div
                ref={scrollRef}
                className="overflow-y-auto px-4 pb-4"
                style={{
                  maxHeight: "calc(55dvh - 72px)",
                  overscrollBehavior: "contain",
                  touchAction: "pan-y",
                  WebkitOverflowScrolling: "touch",
                }}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <VideoCommentsSection
                  key={videoId}
                  videoId={videoId}
                  artistId={artistId}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
