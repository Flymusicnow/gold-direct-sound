import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List, ChevronDown, ChevronUp, X, Shuffle, Repeat, Repeat1, Smartphone } from 'lucide-react';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { useVideoPlayback } from '@/contexts/VideoPlaybackContext';
import { FlightdeckQueueDrawer } from './FlightdeckQueueDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type MiniPlayerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export function FlightdeckPlayer() {
  const {
    currentItem,
    isPlaying,
    currentTime,
    duration,
    playNext,
    playPrev,
    togglePlay,
    seek,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    queue,
    currentIndex,
    clearQueue,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    queueOpen,
    setQueueOpen,
  } = useFlightdeck();
  
  const { pauseAllVideos } = useVideoPlayback();
  const isMobile = useIsMobile();

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const currentItemIdRef = useRef<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  // Default to minimized (compact pill) - full bar only when expanded
  const [isMinimized, setIsMinimized] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [miniPlayerPosition, setMiniPlayerPosition] = useState<MiniPlayerPosition>(() => {
    return (localStorage.getItem('miniPlayerPosition') as MiniPlayerPosition) || 'bottom-right';
  });

  // Calculate progress percentage for thin progress bar
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Swipe gesture state for mobile
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Swipe handlers for main player (swipe down to minimize)
  const handlePlayerTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handlePlayerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
    
    // Swipe down to minimize (vertical swipe, not horizontal)
    if (deltaY > 50 && deltaX < 50 && isMobile) {
      setIsMinimized(true);
    }
    
    touchStartY.current = null;
    touchStartX.current = null;
  }, [isMobile]);

  // Swipe handlers for mini player (swipe up to expand)
  const handleMiniTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleMiniTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
    
    // Swipe up to expand (negative deltaY = upward swipe)
    if (deltaY < -50 && deltaX < 50 && isMobile) {
      setIsMinimized(false);
    }
    
    touchStartY.current = null;
    touchStartX.current = null;
  }, [isMobile]);

  // Position classes map
  const positionClasses: Record<MiniPlayerPosition, string> = {
    'bottom-right': 'bottom-20 md:bottom-4 right-4',
    'bottom-left': 'bottom-20 md:bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('miniPlayerPosition', miniPlayerPosition);
  }, [miniPlayerPosition]);

  // Update media element when current item changes
  // Only reload media when the actual item ID changes, not when queue is reordered
  useEffect(() => {
    if (!currentItem) {
      currentItemIdRef.current = null;
      return;
    }

    // Skip reload if it's the same item (prevents stopping playback on queue reorder)
    if (currentItem.id === currentItemIdRef.current) {
      return;
    }

    currentItemIdRef.current = currentItem.id;

    const mediaElement = currentItem.type === 'track' ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    mediaElement.src = currentItem.mediaUrl;
    mediaElement.load();
    if (isPlaying) {
      mediaElement.play().catch(console.error);
    }
  }, [currentItem?.id, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (!currentItem) return;
    const mediaElement = currentItem.type === 'track' ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      // Pause all videos when Flightdeck starts playing
      pauseAllVideos();
      mediaElement.play().catch(console.error);
    } else {
      mediaElement.pause();
    }
  }, [isPlaying, currentItem, pauseAllVideos]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    const mediaElement = currentItem?.type === 'track' ? audioRef.current : videoRef.current;
    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const mediaElement = currentItem?.type === 'track' ? audioRef.current : videoRef.current;
    if (mediaElement) {
      setDuration(mediaElement.duration);
    }
  };

  const handleEnded = () => {
    if (currentIndex < queue.length - 1) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    seek(newTime);
    const mediaElement = currentItem?.type === 'track' ? audioRef.current : videoRef.current;
    if (mediaElement) {
      mediaElement.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          if (currentTime > 0) {
            handleSeek([Math.max(0, currentTime - 10)]);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (duration > 0) {
            handleSeek([Math.min(duration, currentTime + 10)]);
          }
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, togglePlay, toggleMute]);

  if (!currentItem) return null;

  return (
    <>
      {/* Mobile Queue Drawer - shows queue list only */}
      <FlightdeckQueueDrawer 
        isOpen={queueOpen} 
        onClose={() => setQueueOpen(false)}
      />

      {/* Hidden media elements - always present */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />

      {/* Main Player Bar - Hidden when queue is open */}
      <div 
        ref={playerRef}
        className={cn(
          "fixed bottom-16 md:bottom-0 lg:bottom-0 left-0 right-0 z-[60] transition-all duration-300 pb-safe",
          queueOpen && "opacity-0 pointer-events-none translate-y-full"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handlePlayerTouchStart}
        onTouchEnd={handlePlayerTouchEnd}
      >
        
        {/* Close button - appears on hover (desktop only) */}
        <button
          onClick={() => setIsMinimized(true)}
          className={`absolute -top-3 right-4 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-md text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Player Bar */}
        <div className={`bg-card border-t border-border shadow-lg transition-transform duration-300 ease-in-out ${
          isMinimized ? 'translate-y-full' : ''
        }`}>

      <div className="container mx-auto px-4 py-3">
        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Track Info - Clickable link to artist */}
          <Link 
            to={`/artist/${currentItem.artistUserId}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            {currentItem.coverUrl && (
              <img
                src={currentItem.coverUrl}
                alt={currentItem.title}
                className="w-12 h-12 rounded object-cover border border-primary/30"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{currentItem.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentItem.artistName}</p>
            </div>
          </Link>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Shuffle Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleShuffle}
                    className={cn(
                      "h-8 w-8 hidden sm:flex",
                      shuffleEnabled && "text-primary"
                    )}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{shuffleEnabled ? 'Shuffle On' : 'Shuffle Off'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={playPrev}
              disabled={currentIndex === 0 && repeatMode !== 'all'}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={playNext}
              disabled={currentIndex === queue.length - 1 && repeatMode !== 'all'}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            
            {/* Repeat Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cycleRepeat}
                    className={cn(
                      "h-8 w-8 hidden sm:flex",
                      repeatMode !== 'off' && "text-primary"
                    )}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 className="h-4 w-4" />
                    ) : (
                      <Repeat className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {repeatMode === 'off' && 'Repeat Off'}
                    {repeatMode === 'all' && 'Repeat All'}
                    {repeatMode === 'one' && 'Repeat One'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Volume and Queue */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
            {/* Mobile Volume Message */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="sm:hidden flex items-center gap-1 text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="text-xs">Use your device's volume buttons to control playback volume</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Desktop Volume Control */}
            <div className="hidden sm:flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24 lg:w-32"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQueueOpen(!queueOpen)}
              className="h-8 w-8"
            >
              <List className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentIndex + 1}/{queue.length}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>

      {/* Sleek Compact Mini-Player Pill - Default state */}
      {isMinimized && currentItem && !queueOpen && (
        <div 
          ref={miniPlayerRef}
          className={cn(
            "fixed z-[60] group animate-fade-in",
            positionClasses[miniPlayerPosition]
          )}
          onTouchStart={handleMiniTouchStart}
          onTouchEnd={handleMiniTouchEnd}
        >
          {/* Main pill container with overflow hidden for progress bar */}
          <div className="relative bg-card/95 backdrop-blur-md border border-border rounded-full shadow-xl overflow-hidden">
            {/* Thin progress indicator at bottom */}
            <div 
              className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
            
            <div className="flex items-center gap-2 px-2 py-1.5">
              {/* Album Art with play state ring */}
              <button 
                onClick={() => setQueueOpen(true)}
                className="relative flex-shrink-0 hover:scale-105 transition-transform"
              >
                {currentItem.coverUrl ? (
                  <img 
                    src={currentItem.coverUrl} 
                    alt={currentItem.title}
                    className={cn(
                      "w-8 h-8 rounded-full object-cover ring-2 transition-all",
                      isPlaying ? "ring-primary ring-offset-1 ring-offset-card" : "ring-border"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-2 transition-all",
                    isPlaying ? "ring-primary ring-offset-1 ring-offset-card" : "ring-border"
                  )}>
                    <Play className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                {/* Subtle pulse when playing */}
                {isPlaying && (
                  <div className="absolute inset-0 rounded-full ring-2 ring-primary/50 animate-ping opacity-30" />
                )}
              </button>
              
              {/* Track Info - Single line on mobile, two lines on desktop */}
              <button 
                onClick={() => setQueueOpen(true)}
                className="min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <p className="text-xs font-medium truncate max-w-[100px] sm:max-w-[140px]">
                  {currentItem.title}
                  <span className="text-muted-foreground font-normal"> · {currentItem.artistName}</span>
                </p>
              </button>
              
              {/* Play/Pause Button */}
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-7 h-7 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </Button>
              
              {/* Expand to full player - hidden by default, shows on hover/focus */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity flex-shrink-0"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              
              {/* Close Button - Desktop only, shows on hover */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  clearQueue();
                }}
                className="w-6 h-6 rounded-full hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
