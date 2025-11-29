import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "./use-mobile";

interface SwipeBackOptions {
  threshold?: number;
  edgeWidth?: number;
  enabled?: boolean;
  onSwipeProgress?: (progress: number) => void;
}

export function useSwipeBack({
  threshold = 100,
  edgeWidth = 30,
  enabled = true,
  onSwipeProgress,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwipeActive = useRef<boolean>(false);
  const isEdgeSwipe = useRef<boolean>(false);
  const directionLocked = useRef<"horizontal" | "vertical" | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  useEffect(() => {
    if (!isMobile || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      
      // Check if touch starts from left edge
      isEdgeSwipe.current = touch.clientX <= edgeWidth;
      
      if (isEdgeSwipe.current) {
        isSwipeActive.current = true;
        directionLocked.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeActive.current || !isEdgeSwipe.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Lock direction after 10px movement
      if (!directionLocked.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        directionLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      // Only handle horizontal swipes to the right
      if (directionLocked.current === "horizontal" && deltaX > 0) {
        e.preventDefault();
        const progress = Math.min((deltaX / threshold) * 100, 100);
        setSwipeProgress(progress);
        onSwipeProgress?.(progress);
      } else if (directionLocked.current === "vertical") {
        // Allow vertical scroll
        isSwipeActive.current = false;
        setSwipeProgress(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isSwipeActive.current || !isEdgeSwipe.current) return;

      const shouldNavigateBack = swipeProgress >= 100;

      if (shouldNavigateBack) {
        // Haptic feedback if supported
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Small delay for visual feedback
        setTimeout(() => {
          navigate(-1);
        }, 100);
      }

      // Reset state
      isSwipeActive.current = false;
      isEdgeSwipe.current = false;
      directionLocked.current = null;
      setSwipeProgress(0);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, enabled, threshold, edgeWidth, navigate, swipeProgress, onSwipeProgress]);

  return { swipeProgress, isSwipeActive: isSwipeActive.current };
}
