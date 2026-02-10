import { useRef, useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { FullScreenVideoItem } from "./FullScreenVideoItem";
import type { FeedVideo } from "@/hooks/useFullScreenVideoFeed";

// Hide bottom nav bars when fullscreen video feed is open

interface FullScreenVideoFeedProps {
  videos: FeedVideo[];
  initialIndex: number;
  onClose: () => void;
  onCloseFeedForNavigation?: () => void;
}

export function FullScreenVideoFeed({
  videos,
  initialIndex,
  onClose,
  onCloseFeedForNavigation,
}: FullScreenVideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Swipe-to-close state
  const [swipeDelta, setSwipeDelta] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const directionLockedRef = useRef<"horizontal" | "vertical" | null>(null);
  const captionExpandedRef = useRef(false);
  const commentSheetOpenRef = useRef(false);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleCaptionExpandedChange = useCallback((expanded: boolean) => {
    captionExpandedRef.current = expanded;
  }, []);

  const handleCommentSheetChange = useCallback((open: boolean) => {
    commentSheetOpenRef.current = open;
  }, []);

  // Toggle body class to hide bottom nav when mounted
  useEffect(() => {
    document.body.classList.add("video-feed-open");
    return () => {
      document.body.classList.remove("video-feed-open");
    };
  }, []);

  // Scroll to initial video on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const targetEl = itemRefs.current.get(initialIndex);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "instant" });
      }
    });
  }, [initialIndex]);

  // IntersectionObserver to track active video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    itemRefs.current.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [videos.length]);

  const setItemRef = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      if (el) itemRefs.current.set(index, el);
      else itemRefs.current.delete(index);
    },
    []
  );

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ─── Swipe-right-to-close gesture handlers ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start swipe-to-close when comment sheet is open
    if (commentSheetOpenRef.current) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    directionLockedRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    // Lock direction after initial movement
    if (!directionLockedRef.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      directionLockedRef.current =
        Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }

    // Only respond to horizontal rightward swipes
    if (directionLockedRef.current === "horizontal" && dx > 0) {
      setSwipeDelta(dx);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (
      directionLockedRef.current === "horizontal" &&
      swipeDelta > 80
    ) {
      // Threshold crossed — close the viewer
      onClose();
    }
    // Reset
    setSwipeDelta(0);
    touchStartRef.current = null;
    directionLockedRef.current = null;
  }, [swipeDelta, onClose]);

  // Visual feedback styles during swipe
  const swipeStyle =
    swipeDelta > 0
      ? {
          transform: `translateX(${swipeDelta}px)`,
          opacity: Math.max(0.3, 1 - swipeDelta / 300),
          transition: "none" as const,
        }
      : {
          transform: "translateX(0)",
          opacity: 1,
          transition: "transform 0.25s ease-out, opacity 0.25s ease-out",
        };

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-14 left-4 z-[110] w-10 h-10 rounded-full bg-black/40 flex items-center justify-center touch-manipulation"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Swipeable + snap-scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-contain"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          ...swipeStyle,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            ref={(el) => setItemRef(index, el)}
            data-index={index}
          >
            <FullScreenVideoItem
              video={video}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onClose={onClose}
              onCloseFeedForNavigation={onCloseFeedForNavigation}
              onCaptionExpandedChange={handleCaptionExpandedChange}
              onCommentSheetChange={handleCommentSheetChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
