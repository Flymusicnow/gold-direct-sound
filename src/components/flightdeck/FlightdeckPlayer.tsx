import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List, ChevronDown, ChevronUp, X, Settings } from 'lucide-react';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { useVideoPlayback } from '@/contexts/VideoPlaybackContext';
import { FlightdeckQueueSidebar } from './FlightdeckQueueSidebar';
import { FlightdeckQueueDrawer } from './FlightdeckQueueDrawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  } = useFlightdeck();
  
  const { pauseAllVideos } = useVideoPlayback();

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [miniPlayerPosition, setMiniPlayerPosition] = useState<MiniPlayerPosition>(() => {
    return (localStorage.getItem('miniPlayerPosition') as MiniPlayerPosition) || 'bottom-right';
  });

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
  useEffect(() => {
    if (!currentItem) return;

    const mediaElement = currentItem.type === 'track' ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    mediaElement.src = currentItem.mediaUrl;
    mediaElement.load();
    if (isPlaying) {
      mediaElement.play().catch(console.error);
    }
  }, [currentItem]);

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
      {/* Desktop Queue Sidebar - with integrated player controls */}
      <FlightdeckQueueSidebar 
        isOpen={queueOpen} 
        onClose={() => setQueueOpen(false)}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
      />
      
      {/* Mobile Queue Drawer - with integrated player controls */}
      <FlightdeckQueueDrawer 
        isOpen={queueOpen} 
        onClose={() => setQueueOpen(false)}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
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
        className={cn(
          "fixed bottom-14 md:bottom-0 left-0 right-0 z-[60] transition-all duration-300",
          queueOpen && "opacity-0 pointer-events-none translate-y-full"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={playPrev}
              disabled={currentIndex === 0}
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
              disabled={currentIndex === queue.length - 1}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume and Queue */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="hidden sm:flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-32"
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentIndex + 1}/{queue.length}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>

      {/* Compact Mini-Player when minimized */}
      {isMinimized && currentItem && !queueOpen && (
        <div className={cn(
          "fixed z-[60] flex items-center gap-3 px-4 py-2.5 rounded-full bg-card border border-border shadow-xl animate-fade-in",
          positionClasses[miniPlayerPosition]
        )}>
          {/* Album Art - Clickable */}
          <Link to={`/artist/${currentItem.artistUserId}`} className="hover:opacity-80 transition-opacity">
            {currentItem.coverUrl && (
              <img 
                src={currentItem.coverUrl} 
                alt={currentItem.title}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-md" 
              />
            )}
          </Link>
          
          {/* Track Info - Clickable */}
          <Link to={`/artist/${currentItem.artistUserId}`} className="max-w-[120px] hidden sm:block hover:opacity-80 transition-opacity">
            <p className="text-sm font-medium truncate text-foreground">{currentItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentItem.artistName}</p>
          </Link>
          
          {/* Play/Pause Button */}
          <Button
            size="sm"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 p-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          {/* Expand Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMinimized(false)}
            className="w-8 h-8 rounded-full p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          
          {/* Position Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 rounded-full p-0"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-3" side="top">
              <p className="text-xs font-semibold mb-2 text-foreground">Mini Player Position</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant={miniPlayerPosition === 'top-left' ? 'default' : 'outline'}
                  onClick={() => setMiniPlayerPosition('top-left')}
                  className="text-xs h-8"
                >
                  ↖ Top Left
                </Button>
                <Button
                  size="sm"
                  variant={miniPlayerPosition === 'top-right' ? 'default' : 'outline'}
                  onClick={() => setMiniPlayerPosition('top-right')}
                  className="text-xs h-8"
                >
                  ↗ Top Right
                </Button>
                <Button
                  size="sm"
                  variant={miniPlayerPosition === 'bottom-left' ? 'default' : 'outline'}
                  onClick={() => setMiniPlayerPosition('bottom-left')}
                  className="text-xs h-8"
                >
                  ↙ Bottom Left
                </Button>
                <Button
                  size="sm"
                  variant={miniPlayerPosition === 'bottom-right' ? 'default' : 'outline'}
                  onClick={() => setMiniPlayerPosition('bottom-right')}
                  className="text-xs h-8"
                >
                  ↘ Bottom Right
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Close Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsMinimized(false);
              clearQueue();
            }}
            className="w-8 h-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
