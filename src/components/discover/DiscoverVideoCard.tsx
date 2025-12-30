import { useState, useRef, useEffect, useId } from 'react';
import { Heart, Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FanActionBar } from '@/components/fan/FanActionBar';
import { DiscoverFeedItem } from '@/hooks/useDiscoverFeed';
import { useLikeTrack } from '@/hooks/useLikeTrack';
import { useVideoPlayback } from '@/contexts/VideoPlaybackContext';
import { useAudioFocus } from '@/contexts/AudioFocusContext';

interface DiscoverVideoCardProps {
  item: DiscoverFeedItem;
  isInView: boolean;
  onOpenOverlay: () => void;
}

export function DiscoverVideoCard({ item, isInView, onOpenOverlay }: DiscoverVideoCardProps) {
  const videoId = useId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { liked, toggleLike } = useLikeTrack(
    item.content_id,
    item.artist_id,
    false // Will be fetched on mount
  );
  const { registerVideo, unregisterVideo, setCurrentVideo, pauseAllVideos } = useVideoPlayback();
  const { onVideoPlay, onVideoPauseOrEnd } = useAudioFocus();

  // Register this video with global video coordination
  useEffect(() => {
    const pauseThisVideo = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    
    registerVideo(videoId, pauseThisVideo);
    return () => unregisterVideo(videoId);
  }, [videoId, registerVideo, unregisterVideo]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isInView && !isPlaying) {
      pauseAllVideos();
      setCurrentVideo(videoId);
      onVideoPlay(videoId);
      
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (!isInView && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onVideoPauseOrEnd(videoId);
    }
  }, [isInView, isPlaying, videoId, pauseAllVideos, setCurrentVideo, onVideoPlay, onVideoPauseOrEnd]);

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setCurrentVideo(null);
      onVideoPauseOrEnd(videoId);
    } else {
      // Pause other videos when this video plays
      pauseAllVideos();
      setCurrentVideo(videoId);
      onVideoPlay(videoId);
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    
    setShowControls(true);
    setTimeout(() => setShowControls(false), 2000);
  };

  const handleDoubleTap = async () => {
    if (!liked) {
      await toggleLike();
      // Trigger heart animation
      const heartEl = document.createElement('div');
      heartEl.innerHTML = '❤️';
      heartEl.className = 'absolute inset-0 flex items-center justify-center text-8xl pointer-events-none animate-ping';
      videoRef.current?.parentElement?.appendChild(heartEl);
      setTimeout(() => heartEl.remove(), 1000);
    }
  };

  return (
    <div className="relative w-full h-screen snap-start bg-background">
      <video
        ref={videoRef}
        src={item.media_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleTap}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/20 pointer-events-none" />

      {/* Play/Pause indicator */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isPlaying ? (
            <Pause className="w-20 h-20 text-white/80 animate-fade-in" />
          ) : (
            <Play className="w-20 h-20 text-white/80 animate-fade-in" />
          )}
        </div>
      )}

      {/* Content info - bottom */}
      <div className="absolute bottom-20 left-0 right-0 p-4 space-y-4">
        {/* Artist info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-primary/50">
            <AvatarImage src={item.artist_avatar || ''} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {item.artist_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-white">{item.artist_name}</p>
            {item.genre && (
              <p className="text-sm text-white/70">{item.genre}</p>
            )}
          </div>
        </div>

        {/* Caption */}
        {item.caption && (
          <p className="text-white text-sm line-clamp-2">{item.caption}</p>
        )}

        {/* Spotlight badge */}
        {item.spotlight_entry_id && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary/50 rounded-full">
            <span className="text-xs font-semibold text-primary">⭐ In Spotlight</span>
          </div>
        )}
      </div>

      {/* Action bar - right side */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike();
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            liked ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground'
          }`}>
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs text-white font-semibold">Like</span>
        </button>

        <button
          onClick={onOpenOverlay}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
            <span className="text-xl">•••</span>
          </div>
          <span className="text-xs text-white font-semibold">More</span>
        </button>
      </div>
    </div>
  );
}
