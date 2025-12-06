import { useState, useRef, useEffect, useId } from "react";
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
}

export function PremiumVideoPlayer({ 
  videoUrl, 
  autoPlay = true, 
  loop = true, 
  className,
  showFrame = true,
  onError 
}: PremiumVideoPlayerProps) {
  const videoId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { setIsPlaying: pauseFlightdeck } = useFlightdeck();
  const { registerVideo, unregisterVideo, setCurrentVideo } = useVideoPlayback();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Detect portrait orientation
      if (video.videoWidth && video.videoHeight) {
        setIsPortrait(video.videoHeight > video.videoWidth);
      }
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

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setCurrentVideo(null);
    } else {
      // Pause Flightdeck audio when video starts playing
      pauseFlightdeck(false);
      setCurrentVideo(videoId);
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
    
    // When unmuting a playing video, pause Flightdeck audio
    if (!newMutedState && isPlaying) {
      pauseFlightdeck(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

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

  if (hasError) {
    if (showFrame) {
      return (
        <div className="video-card-gold-outer">
          <div className={cn("video-card-gold-inner bg-black/20 flex items-center justify-center aspect-video", className)}>
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-2">⚠️ Video Error</p>
              <p className="text-sm text-muted-foreground">Unable to load video</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={cn("rounded-2xl overflow-hidden bg-black/20 flex items-center justify-center aspect-video", className)}>
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">⚠️ Video Error</p>
          <p className="text-sm text-muted-foreground">Unable to load video</p>
        </div>
      </div>
    );
  }

  if (showFrame) {
    return (
      <div className="video-card-gold-outer" ref={containerRef}>
        <div 
          className={cn("video-card-gold-inner relative group", className)}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onTouchStart={() => setShowControls(true)}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay={autoPlay}
            loop={loop}
            muted={isMuted}
            playsInline
            className={cn(
              "w-full bg-black",
              isPortrait ? "max-h-[80vh] object-contain aspect-[9/16]" : "aspect-video object-cover"
            )}
            onClick={togglePlayPause}
          />

          {/* Controls Overlay */}
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
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              {/* Time Display */}
              <div className="text-xs text-white/90 font-mono tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Center Play Button (when paused) */}
          {!isPlaying && (
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 m-auto w-16 h-16 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 hover:scale-110 transition-all"
              aria-label="Play"
            >
              <Play className="h-8 w-8 ml-1" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("rounded-2xl overflow-hidden relative group bg-black", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        className={cn(
          "w-full bg-black",
          isPortrait ? "max-h-[80vh] object-contain aspect-[9/16]" : "aspect-video object-cover"
        )}
        onClick={togglePlayPause}
      />

      {/* Controls Overlay */}
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
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          {/* Time Display */}
          <div className="text-xs text-white/90 font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 m-auto w-16 h-16 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 hover:scale-110 transition-all"
          aria-label="Play"
        >
          <Play className="h-8 w-8 ml-1" />
        </button>
      )}
    </div>
  );
}
