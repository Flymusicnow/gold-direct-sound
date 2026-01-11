import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MiniAudioPreviewProps {
  audioUrl: string;
  trackId: string;
  title: string;
  artistName: string;
  artistId: string;
  coverUrl?: string;
  onPlayFull?: () => void;
  className?: string;
}

const PREVIEW_DURATION = 30; // seconds
const BAR_COUNT = 16;

// Generate consistent waveform heights based on track ID
const generateWaveformBars = (trackId: string) => {
  const bars = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    // Use simple hash based on trackId + index for consistency
    const hash = trackId.charCodeAt(i % trackId.length) + i;
    const height = 20 + (hash % 60); // 20-80% height range
    bars.push({
      height,
      delay: i * 0.03,
    });
  }
  return bars;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function MiniAudioPreview({
  audioUrl,
  trackId,
  title,
  artistName,
  onPlayFull,
  className,
}: MiniAudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const waveformBars = generateWaveformBars(trackId);
  const progress = (currentTime / PREVIEW_DURATION) * 100;

  // Stop at preview duration
  useEffect(() => {
    if (currentTime >= PREVIEW_DURATION && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [currentTime]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleBarClick = useCallback((index: number) => {
    if (!audioRef.current) return;
    const newTime = (index / BAR_COUNT) * PREVIEW_DURATION;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  return (
    <div className={cn("flex items-center gap-2 min-h-[44px]", className)}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
      />

      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={!audioUrl}
        className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-primary" />
        ) : (
          <Play className="h-4 w-4 text-primary ml-0.5" />
        )}
      </Button>

      {/* Waveform Visualization */}
      <div 
        className="flex items-center gap-0.5 h-8 flex-1 cursor-pointer"
        role="slider"
        aria-label={`${title} by ${artistName} preview`}
        aria-valuemin={0}
        aria-valuemax={PREVIEW_DURATION}
        aria-valuenow={currentTime}
      >
        {waveformBars.map((bar, i) => {
          const barProgress = (i / BAR_COUNT) * 100;
          const isActive = barProgress < progress;
          const isPast = barProgress <= progress;

          return (
            <motion.div
              key={i}
              onClick={() => handleBarClick(i)}
              className={cn(
                "w-1 rounded-full transition-colors duration-150 cursor-pointer hover:opacity-80",
                isActive
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              )}
              initial={{ height: 4 }}
              animate={{
                height: isPlaying ? [4, bar.height * 0.4, 4] : (isPast ? bar.height * 0.3 : 4),
                transition: isPlaying ? {
                  duration: 0.4,
                  repeat: Infinity,
                  delay: bar.delay,
                  ease: "easeInOut",
                } : {
                  duration: 0.2,
                },
              }}
              style={{ minHeight: 4 }}
            />
          );
        })}
      </div>

      {/* Time Display */}
      <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0 w-[70px] text-right">
        {formatTime(currentTime)} / 0:30
      </span>

      {/* Full Play Button (optional) */}
      {onPlayFull && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayFull}
          className="h-8 w-8 rounded-full flex-shrink-0"
          title="Play full song"
        >
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
