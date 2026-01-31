import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseLrc, isLrcFormat, findCurrentLineIndex } from '@/lib/lrc-parser';
import { cn } from '@/lib/utils';

interface SyncedLyricsDisplayProps {
  lyrics: string;
  currentTime: number;
  className?: string;
}

export function SyncedLyricsDisplay({ lyrics, currentTime, className }: SyncedLyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse lyrics - handle both LRC and plain text
  const { lines, isSynced } = useMemo(() => {
    if (isLrcFormat(lyrics)) {
      return { lines: parseLrc(lyrics), isSynced: true };
    }
    // Plain text fallback - split by newlines
    const plainLines = lyrics.split('\n').filter(line => line.trim());
    return { 
      lines: plainLines.map((text, i) => ({ time: -1, text })), 
      isSynced: false 
    };
  }, [lyrics]);

  // Find current line for synced lyrics
  const currentLineIndex = useMemo(() => {
    if (!isSynced) return -1;
    return findCurrentLineIndex(lines, currentTime);
  }, [lines, currentTime, isSynced]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && isSynced) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
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
      <ScrollArea className={cn("h-64", className)}>
        <div className="p-6">
          <pre className="whitespace-pre-wrap text-center text-base leading-relaxed font-sans">
            {lyrics}
          </pre>
        </div>
      </ScrollArea>
    );
  }

  // Synced karaoke display with enhanced highlighting
  return (
    <ScrollArea className={cn("h-64", className)}>
      <div ref={containerRef} className="py-8 px-4 space-y-2">
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
                "text-center transition-all duration-300 py-2 px-4 rounded-lg",
                isActive && "text-primary font-bold text-xl bg-primary/15 shadow-lg shadow-primary/20",
                isPast && "text-muted-foreground text-base",
                isFuture && "text-muted-foreground/60 text-base"
              )}
            >
              {line.text}
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
