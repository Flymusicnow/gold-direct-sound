import { useRef, useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { FullScreenVideoItem } from "./FullScreenVideoItem";
import type { FeedVideo } from "@/hooks/useFullScreenVideoFeed";

interface FullScreenVideoFeedProps {
  videos: FeedVideo[];
  initialIndex: number;
  onClose: () => void;
  onShare?: (video: FeedVideo) => void;
}

export function FullScreenVideoFeed({
  videos,
  initialIndex,
  onClose,
  onShare,
}: FullScreenVideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll to initial video on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Delay to ensure DOM is ready
    requestAnimationFrame(() => {
      const targetEl = itemRefs.current.get(initialIndex);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "instant" });
      }
    });
  }, [initialIndex]);

  // Set up IntersectionObserver to track active video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    // Observe all items
    itemRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [videos.length]);

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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

      {/* Video counter */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[110] text-white/60 text-xs font-medium">
        {activeIndex + 1} / {videos.length}
      </div>

      {/* Snap-scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-contain"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
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
              onClose={onClose}
              onShare={onShare}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
