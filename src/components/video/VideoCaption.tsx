import { useRef, useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoCaptionProps {
  caption: string | null;
  artistName: string;
  artistAvatar: string | null;
  artistUserId: string;
  onArtistTap: (e: React.MouseEvent | React.TouchEvent) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export function VideoCaption({
  caption,
  artistName,
  artistAvatar,
  onArtistTap,
  onExpandedChange,
}: VideoCaptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const panelTouchStartY = useRef<number | null>(null);

  // Detect if caption overflows the 2-line preview
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Compare scrollHeight (full text) vs clientHeight (clamped)
    setIsTruncated(el.scrollHeight > el.clientHeight + 2);
  }, [caption]);

  // Notify parent of expanded state changes
  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const handleCaptionTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (isTruncated && !expanded) {
        setExpanded(true);
      }
    },
    [isTruncated, expanded]
  );

  const handleBackdropTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setExpanded(false);
    },
    []
  );

  // Swipe-down to collapse
  const handlePanelTouchStart = useCallback(
    (e: React.TouchEvent) => {
      panelTouchStartY.current = e.touches[0].clientY;
    },
    []
  );

  const handlePanelTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (panelTouchStartY.current === null) return;
      const deltaY = e.changedTouches[0].clientY - panelTouchStartY.current;
      if (deltaY > 60) {
        setExpanded(false);
      }
      panelTouchStartY.current = null;
    },
    []
  );

  if (!caption && !artistName) return null;

  return (
    <>
      {/* ─── Collapsed Preview ─── */}
      <div className="absolute bottom-6 left-4 right-16 z-20">
        {/* Artist row */}
        <button
          onClick={onArtistTap}
          onTouchEnd={(e) => {
            e.preventDefault();
            onArtistTap(e);
          }}
          className="flex items-center gap-2.5 mb-2 touch-manipulation"
        >
          <Avatar className="h-9 w-9 ring-2 ring-white/30">
            <AvatarImage src={artistAvatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
              {artistName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold text-sm drop-shadow-lg">
            {artistName}
          </span>
        </button>

        {/* Caption with fade mask */}
        {caption && (
          <div
            onClick={handleCaptionTap}
            className="relative cursor-pointer touch-manipulation"
          >
            <p
              ref={textRef}
              className="text-white/90 text-sm leading-relaxed drop-shadow-lg"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                ...(isTruncated
                  ? {
                      maskImage:
                        "linear-gradient(to bottom, black 40%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 40%, transparent 100%)",
                    }
                  : {}),
              }}
            >
              {caption}
            </p>

            {isTruncated && !expanded && (
              <span className="text-white/60 text-xs font-medium mt-1 inline-block">
                More
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Expanded Panel ─── */}
      <AnimatePresence>
        {expanded && caption && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-30 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleBackdropTap}
            />

            {/* Bottom sheet panel */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md rounded-t-2xl"
              style={{ maxHeight: "60dvh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handlePanelTouchStart}
              onTouchEnd={handlePanelTouchEnd}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>

              {/* Artist row in panel */}
              <div className="flex items-center gap-2.5 px-5 pb-3 border-b border-white/10">
                <Avatar className="h-8 w-8 ring-1 ring-white/20">
                  <AvatarImage src={artistAvatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {artistName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-sm">
                  {artistName}
                </span>

                <button
                  onClick={() => setExpanded(false)}
                  className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center touch-manipulation"
                  aria-label="Collapse caption"
                >
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </button>
              </div>

              {/* Scrollable caption */}
              <div
                className="px-5 py-4 overflow-y-auto"
                style={{ maxHeight: "calc(60dvh - 80px)" }}
              >
                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                  {caption}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
