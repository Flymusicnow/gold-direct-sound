import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, RotateCcw, Check, Music } from 'lucide-react';
import { formatLrcTime, formatDisplayTime, toLrcString, plainTextToLines, type LrcLine } from '@/lib/lrc-parser';
import { cn } from '@/lib/utils';

interface LyricsTimeSyncEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plainLyrics: string;
  audioUrl: string;
  onSave: (syncedLyrics: string) => void;
}

export function LyricsTimeSyncEditor({
  open,
  onOpenChange,
  plainLyrics,
  audioUrl,
  onSave,
}: LyricsTimeSyncEditorProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentLineRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize lines from plain lyrics
  useEffect(() => {
    if (open) {
      const textLines = plainTextToLines(plainLyrics);
      setLines(textLines.map(text => ({ time: -1, text })));
      setCurrentIndex(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [open, plainLyrics]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTapLine = useCallback((index: number) => {
    if (index !== currentIndex) return; // Only allow syncing current line
    
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: currentTime };
      return updated;
    });
    
    // Move to next line
    if (currentIndex < lines.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, currentTime, lines.length]);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentIndex]);

  const handleReset = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.pause();
    }
    setCurrentTime(0);
    setIsPlaying(false);
    setLines(prev => prev.map(line => ({ ...line, time: -1 })));
    setCurrentIndex(0);
  }, []);

  const handleSave = useCallback(() => {
    // Filter out lines without timestamps and convert to LRC
    const syncedLines = lines.filter(line => line.time >= 0);
    if (syncedLines.length === 0) {
      // If no lines synced, save as plain text
      onSave(plainLyrics);
    } else {
      const lrcString = toLrcString(syncedLines);
      onSave(lrcString);
    }
    onOpenChange(false);
  }, [lines, plainLyrics, onSave, onOpenChange]);

  const syncedCount = lines.filter(l => l.time >= 0).length;
  const allSynced = syncedCount === lines.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Sync Lyrics with Music
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">1. Press Play to start the song</span>
            <span className="block">2. Tap each line when you hear it sung</span>
            <span className="block">3. The timestamp will be recorded automatically</span>
          </DialogDescription>
        </DialogHeader>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Playback controls */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              className="h-10 w-10"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="text-sm font-mono">
              {formatDisplayTime(currentTime)} / {formatDisplayTime(duration)}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="text-sm text-muted-foreground text-center">
          {syncedCount} / {lines.length} lines synced
        </div>

        {/* Warning when not playing */}
        {!isPlaying && currentIndex < lines.length && (
          <div className="text-center text-amber-500 text-sm py-2 bg-amber-500/10 rounded-lg">
            ⚠️ Press Play first, then tap lines as they're sung
          </div>
        )}

        {/* Lines to sync */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[50vh]">
          <div className="space-y-2 p-2">
            {lines.map((line, index) => {
              const isSynced = line.time >= 0;
              const isCurrent = index === currentIndex;
              const isPast = index < currentIndex;

              return (
                <button
                  key={index}
                  ref={isCurrent ? currentLineRef : null}
                  onClick={() => handleTapLine(index)}
                  disabled={!isCurrent || !isPlaying}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all flex items-center justify-between gap-2",
                    isCurrent && isPlaying && "bg-primary/20 border-2 border-primary animate-pulse",
                    isCurrent && !isPlaying && "bg-primary/10 border-2 border-primary/50",
                    isPast && "bg-muted/50 opacity-70",
                    !isCurrent && !isPast && "bg-muted/30 opacity-50",
                    isCurrent && isPlaying && "cursor-pointer hover:bg-primary/30"
                  )}
                >
                  <span className={cn(
                    "flex-1",
                    isCurrent && "font-medium"
                  )}>
                    {line.text}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground min-w-[50px] text-right">
                    {isSynced ? formatDisplayTime(line.time) : '--:--'}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={syncedCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Save {allSynced ? 'All' : `${syncedCount}`} Lines
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
