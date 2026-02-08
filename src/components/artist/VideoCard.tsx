import { useState, useRef, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Play, Heart } from "lucide-react";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";
import { useSupporterAccess } from "@/hooks/useSupporterAccess";
import { LockedContentOverlay } from "@/components/supporter/LockedContentOverlay";
import { SupporterExclusiveBadge } from "@/components/supporter/SupporterExclusiveBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { useAudioFocus } from "@/contexts/AudioFocusContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  thumbnail_url?: string | null;
}

interface VideoCardProps {
  video: VideoPost;
  index: number;
  artistId: string;
  autoplayEnabled?: boolean;
  onOpenFullscreen: (index: number) => void;
  onShare: (video: VideoPost) => void;
  onUnlock: () => void;
}

export function VideoCard({
  video,
  index,
  artistId,
  autoplayEnabled = true,
  onOpenFullscreen,
  onShare,
  onUnlock,
}: VideoCardProps) {
  const videoId = useId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { registerVideo, unregisterVideo, setCurrentVideo, pauseAllVideos } = useVideoPlayback();
  const { onVideoPlay, onVideoPauseOrEnd } = useAudioFocus();
  
  const { hasAccess, loading: accessLoading } = useSupporterAccess(
    artistId,
    video.is_supporter_only ? video.required_tier : null
  );

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

  // Check if user has liked this video (using video_id in a video_likes table or similar)
  // For now, we'll use a local state approach since video_likes table may not exist

  const handleVideoClick = () => {
    if (!hasAccess && video.is_supporter_only) {
      onUnlock();
      return;
    }
    
    // Toggle play/pause or open fullscreen
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Open fullscreen for better experience
      onOpenFullscreen(index);
    }
  };

  const handlePlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('[VideoCard] Play button clicked/touched');
    
    if (!hasAccess && video.is_supporter_only) {
      onUnlock();
      return;
    }
    
    // Start playing inline or open fullscreen
    if (videoRef.current) {
      pauseAllVideos();
      setCurrentVideo(videoId);
      onVideoPlay(videoId);
      
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log('[VideoCard] Autoplay failed, opening fullscreen:', err);
        // If autoplay fails, open fullscreen (iOS Safari requirement)
        onOpenFullscreen(index);
      });
    } else {
      onOpenFullscreen(index);
    }
  };

  // Handle video pause/end events
  const handleVideoPause = () => {
    setIsPlaying(false);
    onVideoPauseOrEnd(videoId);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onVideoPauseOrEnd(videoId);
  };

  // iOS Safari touch handler
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[VideoCard] Touch end on play button');
    handlePlayClick(e);
  };

  const handleLikeVideo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to like videos");
      return;
    }
    
    // Toggle like state locally (optimistic update)
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <div className="space-y-3">
      <div
        className="cursor-pointer group relative rounded-2xl overflow-hidden touch-manipulation interactive-card isolate"
        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
        onClick={handleVideoClick}
      >
        {/* Video element - always in DOM for ref access */}
        <video
          ref={videoRef}
          src={video.video_url}
          className={cn(
            "w-full aspect-video object-cover",
            video.is_supporter_only && !hasAccess && 'blur-sm',
            video.thumbnail_url && !isPlaying && 'opacity-0 absolute inset-0'
          )}
          playsInline
          webkit-playsinline="true"
          muted={!isPlaying}
          loop
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
        />
        
        {/* Thumbnail overlay - shown when not playing */}
        {video.thumbnail_url && !isPlaying && (
          <img
            src={video.thumbnail_url}
            alt={video.caption || 'Video thumbnail'}
            className={cn(
              "w-full aspect-video object-cover",
              video.is_supporter_only && !hasAccess && 'blur-sm'
            )}
          />
        )}

        {/* Play button overlay - always visible when not playing */}
        {!isPlaying && hasAccess && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
          >
            <button
              type="button"
              onClick={handlePlayClick}
              onTouchEnd={handleTouchEnd}
              className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-transform touch-manipulation"
              aria-label="Play video"
            >
              <Play className="w-8 h-8 text-background fill-background ml-1" />
            </button>
          </div>
        )}

        {/* Locked overlay */}
        {video.is_supporter_only && !hasAccess && !accessLoading && (
          <LockedContentOverlay
            requiredTier={video.required_tier as "basic" | "gold"}
            onUnlock={onUnlock}
          />
        )}

        {/* Hover overlay for additional interaction feedback */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      </div>

      <div className="flex items-center gap-2">
        {video.caption && (
          <p className="text-sm text-muted-foreground px-2 flex-1">{video.caption}</p>
        )}
        {video.is_supporter_only && video.required_tier && (
          <SupporterExclusiveBadge
            tier={video.required_tier as "basic" | "gold"}
            className="flex-shrink-0"
          />
        )}
      </div>

      <div className="flex justify-between items-center px-2">
        {/* Like button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLikeVideo}
          className={`gap-1 ${isLiked ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </Button>
        
        {/* Share button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onShare(video);
          }}
          className="text-primary hover:text-primary/80"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}