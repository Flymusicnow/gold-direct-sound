import { useVideoSession } from '@/contexts/VideoSessionContext';
import { useAudioFocus } from '@/contexts/AudioFocusContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Minimize2, Play, Pause } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useRef } from 'react';

export function VideoSessionModal() {
  const { t } = useLanguage();
  const {
    activeSession,
    isModalOpen,
    videoRef,
    pauseVideo,
    resumeVideo,
    closeVideo,
    minimizeToMini,
    syncTime,
  } = useVideoSession();
  
  const { onVideoPlay, onVideoPauseOrEnd } = useAudioFocus();
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Sync time from mini player to modal
  useEffect(() => {
    if (isModalOpen && activeSession && modalVideoRef.current) {
      modalVideoRef.current.currentTime = activeSession.currentTime;
      if (activeSession.isPlaying) {
        modalVideoRef.current.play().catch(console.error);
      }
    }
  }, [isModalOpen]);

  // Sync modal video ref to context
  useEffect(() => {
    if (isModalOpen && modalVideoRef.current) {
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = modalVideoRef.current;
    }
  }, [isModalOpen, videoRef]);

  const handleTimeUpdate = () => {
    if (modalVideoRef.current) {
      syncTime(modalVideoRef.current.currentTime);
    }
  };

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

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSession?.isPlaying) {
      pauseVideo();
    } else {
      resumeVideo();
    }
  };

  const handleClose = () => {
    closeVideo();
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    minimizeToMini();
  };

  if (!activeSession || !isModalOpen) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && minimizeToMini()}>
      <DialogContent 
        className="max-w-5xl w-full h-[85vh] p-0 bg-black/95 border-primary/20"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{activeSession.title || t('videoPlayer.video')}</DialogTitle>
        </VisuallyHidden>

        {/* Control bar at top */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={handleMinimize}
            aria-label={t('videoPlayer.minimize')}
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Video container - full size with controls */}
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <video
              ref={modalVideoRef}
              src={activeSession.srcUrl}
              poster={activeSession.posterUrl}
              className="w-full aspect-video object-contain bg-black rounded-lg"
              playsInline
              loop
              controls
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              onPause={handlePause}
            />
            
            {/* Center play button when paused */}
            {!activeSession.isPlaying && (
              <button
                type="button"
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                aria-label={t('common.resume')}
              >
                <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                  <Play className="w-10 h-10 text-primary-foreground ml-1" />
                </div>
              </button>
            )}
          </div>
          
          {/* Title and artist */}
          <div className="mt-4 text-center">
            {activeSession.title && (
              <h3 className="text-lg font-medium text-white">{activeSession.title}</h3>
            )}
            {activeSession.artistName && (
              <p className="text-sm text-white/70 mt-1">{activeSession.artistName}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
