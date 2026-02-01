import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseLrc, isLrcFormat, findCurrentLineIndex, stripTimestamps } from '@/lib/lrc-parser';
import { cn } from '@/lib/utils';

interface SyncedLyricsDisplayProps {
  lyrics: string;
  currentTime: number;
  className?: string;
}

export function SyncedLyricsDisplay({ lyrics, currentTime, className }: SyncedLyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse lyrics - handle both LRC and plain text
  const { lines, isSynced } = useMemo(() => {
    if (isLrcFormat(lyrics)) {
      return { lines: parseLrc(lyrics), isSynced: true };
    }
    // Plain text fallback - split by newlines and strip any accidental timestamps
    const plainLines = lyrics.split('\n').filter(line => line.trim());
    return { 
      lines: plainLines.map((text) => ({ time: -1, text: stripTimestamps(text) })), 
      isSynced: false 
    };
  }, [lyrics]);

  // Find current line for synced lyrics
  const currentLineIndex = useMemo(() => {
    if (!isSynced) return -1;
    return findCurrentLineIndex(lines, currentTime);
  }, [lines, currentTime, isSynced]);

  // Robust auto-scroll - always center active line (mobile compatible)
  useEffect(() => {
    if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
    
    // Small delay to ensure parent animation completes + double RAF for layout stability
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          const activeLine = activeLineRef.current;
          if (!container || !activeLine) return;
          
          const containerRect = container.getBoundingClientRect();
          const lineRect = activeLine.getBoundingClientRect();
          
          // Skip if container not yet visible (animation not complete)
          if (containerRect.height === 0) return;
          
          const scrollOffset = lineRect.top - containerRect.top - 
            (containerRect.height / 2) + (lineRect.height / 2);
          
          container.scrollTo({
            top: container.scrollTop + scrollOffset,
            behavior: 'smooth'
          });
        });
      });
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [currentLineIndex, isSynced]);

  if (lines.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
        No lyrics available
      </div>
    );
  }

  // Plain text (non-synced) display
  if (!isSynced) {
    return (
      <div 
        ref={scrollContainerRef}
        className={cn("h-64 overflow-y-auto", className)}
      >
        <div className="py-32 px-6">
          <pre className="whitespace-pre-wrap text-center text-base leading-relaxed font-sans">
            {stripTimestamps(lyrics)}
          </pre>
        </div>
      </div>
    );
  }

  // Synced karaoke display with centered scrolling
  return (
    <div 
      ref={scrollContainerRef}
      className={cn("overflow-y-auto", className)}
    >
      {/* Large padding so first/last lines can be centered */}
      <div className="py-32 px-4 space-y-3">
        {lines.map((line, index) => {
          const isActive = index === currentLineIndex;
          const isPast = index < currentLineIndex;
          const isFuture = index > currentLineIndex;

          return (
            <motion.div
              key={index}
              ref={isActive ? activeLineRef : null}
              initial={{ opacity: 0.35 }}
              animate={{
                opacity: isActive ? 1 : isPast ? 0.5 : 0.35,
                scale: isActive ? 1.08 : 1,
                y: isActive ? -2 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "text-center transition-all duration-300 py-3 px-4 rounded-lg",
                isActive && "text-primary font-bold text-xl bg-primary/15 shadow-lg shadow-primary/20",
                isPast && "text-muted-foreground text-base",
                isFuture && "text-muted-foreground/60 text-base"
              )}
            >
              {stripTimestamps(line.text)}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
