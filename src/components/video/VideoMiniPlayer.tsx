import { useVideoSession } from '@/contexts/VideoSessionContext';
import { useAudioFocus } from '@/contexts/AudioFocusContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function VideoMiniPlayer() {
  const { t } = useLanguage();
  const {
    activeSession,
    isMiniPlayerOpen,
    videoRef,
    pauseVideo,
    resumeVideo,
    closeVideo,
    expandToModal,
    syncTime,
  } = useVideoSession();
  
  const { onVideoPlay, onVideoPauseOrEnd } = useAudioFocus();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle time sync
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      syncTime(videoRef.current.currentTime);
    }
  };

  // Handle play state changes
  const handlePlay = () => {
    if (activeSession) {
      onVideoPlay(activeSession.videoId);
    }
  };

  const handlePause = () => {
    if (activeSession) {
      onVideoPauseOrEnd(activeSession.videoId);
    }
  };

  const handleEnded = () => {
    if (activeSession) {
      onVideoPauseOrEnd(activeSession.videoId);
    }
  };

  // Toggle play/pause
  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSession?.isPlaying) {
      pauseVideo();
    } else {
      resumeVideo();
    }
  };

  // Close handler
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeVideo();
  };

  // Expand to modal
  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    expandToModal();
  };

  // Auto-play when session starts
  useEffect(() => {
    if (activeSession?.isPlaying && videoRef.current && isMiniPlayerOpen) {
      videoRef.current.play().catch(console.error);
    }
  }, [activeSession?.videoId, isMiniPlayerOpen]);

  if (!activeSession || !isMiniPlayerOpen) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-24 right-4 z-40",
        "w-72 bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl",
        "overflow-hidden transition-all duration-300 ease-out",
        "animate-in slide-in-from-bottom-4 fade-in"
      )}
    >
      {/* Video container */}
      <div 
        className="relative aspect-video bg-black cursor-pointer"
        onClick={handleExpand}
      >
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          src={activeSession.srcUrl}
          poster={activeSession.posterUrl}
          className="w-full h-full object-cover"
          playsInline
          loop
          muted={false}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
        
        {/* Control buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={handleExpand}
            aria-label={t('videoPlayer.expand')}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Center play/pause */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-2 left-2 h-8 w-8 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full"
          onClick={togglePlayPause}
          aria-label={activeSession.isPlaying ? t('common.pause') : t('common.resume')}
        >
          {activeSession.isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
      </div>
      
      {/* Info bar */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">
          {activeSession.title || t('videoPlayer.untitled')}
        </p>
        {activeSession.artistName && (
          <p className="text-xs text-muted-foreground truncate">
            {activeSession.artistName}
          </p>
        )}
      </div>
    </div>
  );
}
