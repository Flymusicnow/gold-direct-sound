import { useState, useRef, useEffect, useId, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlightdeck } from "@/contexts/FlightdeckContext";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";

interface PremiumVideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
  showFrame?: boolean;
  onError?: () => void;
  enableVisibilityAutoplay?: boolean;
}

export function PremiumVideoPlayer({ 
  videoUrl, 
  autoPlay = false, 
  loop = true, 
  className,
  showFrame = true,
  onError,
  enableVisibilityAutoplay = false
}: PremiumVideoPlayerProps) {
  const videoId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  const { setIsPlaying: pauseFlightdeck } = useFlightdeck();
  const { registerVideo, unregisterVideo, setCurrentVideo, currentVideoId, pauseAllVideos } = useVideoPlayback();

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
    };
  }, [onError]);

  // Pause this video when another video becomes current
  useEffect(() => {
    if (currentVideoId && currentVideoId !== videoId && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [currentVideoId, videoId]);

  // IntersectionObserver for smart autoplay on scroll
  useEffect(() => {
    if (!enableVisibilityAutoplay || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            // Video is 75%+ visible - play it
            if (videoRef.current && videoRef.current.paused) {
              pauseAllVideos();
              setCurrentVideo(videoId);
              pauseFlightdeck(false);
              
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  // Autoplay was blocked - show play overlay
                  setAutoplayBlocked(true);
                });
              }
            }
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.25) {
            // Video left viewport - pause it
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              if (currentVideoId === videoId) {
                setCurrentVideo(null);
              }
            }
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px'
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enableVisibilityAutoplay, videoId, pauseAllVideos, setCurrentVideo, pauseFlightdeck, currentVideoId]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    setAutoplayBlocked(false);
    
    if (isPlaying) {
      videoRef.current.pause();
      setCurrentVideo(null);
    } else {
      pauseAllVideos();
      pauseFlightdeck(false);
      setCurrentVideo(videoId);
      videoRef.current.play().catch(() => {
        setAutoplayBlocked(true);
      });
    }
  }, [isPlaying, pauseAllVideos, pauseFlightdeck, setCurrentVideo, videoId]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
    
    if (!newMutedState && isPlaying) {
      pauseFlightdeck(false);
    }
  }, [isMuted, isPlaying, pauseFlightdeck]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Register this video with the global video coordination system
  useEffect(() => {
    const pauseThisVideo = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    
    registerVideo(videoId, pauseThisVideo);
    return () => unregisterVideo(videoId);
  }, [videoId, registerVideo, unregisterVideo]);

  // Common video element props
  const videoProps = {
    ref: videoRef,
    src: videoUrl,
    loop,
    muted: isMuted,
    playsInline: true,
    preload: "metadata" as const,
    onClick: togglePlayPause,
  };

  // Common video classes - always use 9:16 aspect ratio with proper containment
  const videoClasses = "w-full max-w-full h-full object-cover";

  if (hasError) {
    if (showFrame) {
      return (
        <div className="video-card-gold-outer">
          <div className={cn("video-card-gold-inner bg-black/20 flex items-center justify-center aspect-[9/16] max-h-[80vh]", className)}>
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-2">⚠️ Video Error</p>
              <p className="text-sm text-muted-foreground">Unable to load video</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={cn("rounded-2xl overflow-hidden bg-black/20 flex items-center justify-center aspect-[9/16] max-h-[80vh]", className)}>
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">⚠️ Video Error</p>
          <p className="text-sm text-muted-foreground">Unable to load video</p>
        </div>
      </div>
    );
  }

  const controlsOverlay = (
    <div 
      className={cn(
        "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Progress Bar */}
      <div 
        className="video-progress-gold mb-3 cursor-pointer rounded-full relative h-2 touch-none"
        onClick={handleSeek}
        onTouchStart={handleSeek}
      >
        <div 
          className="video-progress-gold-fill absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={togglePlayPause}
          className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <div className="text-xs text-white/90 font-mono tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <button
          onClick={toggleMute}
          className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  const centerPlayButton = (!isPlaying || autoplayBlocked) && (
    <button
      onClick={togglePlayPause}
      className="absolute inset-0 m-auto w-16 h-16 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 hover:scale-110 transition-all z-10"
      aria-label="Play"
    >
      <Play className="h-8 w-8 ml-1" />
    </button>
  );

  if (showFrame) {
    return (
      <div className="video-card-gold-outer w-full max-w-full overflow-hidden" ref={containerRef}>
        <div 
          className={cn(
            "video-card-gold-inner relative group aspect-[9/16] max-h-[80vh] w-full overflow-hidden bg-black",
            className
          )}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onTouchStart={() => setShowControls(true)}
        >
          <video {...videoProps} className={videoClasses} />
          {controlsOverlay}
          {centerPlayButton}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "rounded-2xl overflow-hidden relative group bg-black aspect-[9/16] max-h-[80vh] w-full max-w-full",
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video {...videoProps} className={videoClasses} />
      {controlsOverlay}
      {centerPlayButton}
    </div>
  );
}
