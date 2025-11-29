import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List } from 'lucide-react';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { FlightdeckMiniQueue } from './FlightdeckMiniQueue';

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
  } = useFlightdeck();

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);

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
      mediaElement.play().catch(console.error);
    } else {
      mediaElement.pause();
    }
  }, [isPlaying, currentItem]);

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

  if (!currentItem) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Mini Queue */}
      <FlightdeckMiniQueue isExpanded={queueExpanded} onToggle={() => setQueueExpanded(!queueExpanded)} />
      
      {/* Player Bar */}
      <div className="bg-card border-t border-border shadow-lg">
      {/* Hidden media elements */}
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
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
          </div>

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
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10"
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
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQueueExpanded(!queueExpanded)}
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
  );
}
