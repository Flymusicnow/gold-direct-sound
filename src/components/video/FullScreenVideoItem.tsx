import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Share2, Play, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useVideoLikes } from "@/hooks/useVideoLikes";
import { VideoCaption } from "./VideoCaption";
import { VideoCommentSheet } from "./VideoCommentSheet";
import type { FeedVideo } from "@/hooks/useFullScreenVideoFeed";

interface FullScreenVideoItemProps {
  video: FeedVideo;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  onCloseFeedForNavigation?: () => void;
  onCaptionExpandedChange?: (expanded: boolean) => void;
  onCommentSheetChange?: (open: boolean) => void;
}

export function FullScreenVideoItem({
  video,
  isActive,
  isMuted,
  onToggleMute,
  onClose,
  onCloseFeedForNavigation,
  onCaptionExpandedChange,
  onCommentSheetChange,
}: FullScreenVideoItemProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const playIconTimeout = useRef<ReturnType<typeof setTimeout>>();
  const doubleTapTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastTap = useRef<number>(0);
  const [showHeart, setShowHeart] = useState(false);
  const commentSheetOpenRef = useRef(false);

  const { isLiked, likeCount, toggleLike } = useVideoLikes(video.id);

  // Autoplay/pause based on visibility
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => {});
      setIsPaused(false);
    } else {
      el.pause();
    }
  }, [isActive]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (playIconTimeout.current) clearTimeout(playIconTimeout.current);
      if (doubleTapTimeout.current) clearTimeout(doubleTapTimeout.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    // Don't handle tap-to-pause when comment sheet is open
    if (commentSheetOpenRef.current) return;
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;
    lastTap.current = now;

    // Double-tap to like
    if (timeSinceLastTap < 300) {
      if (doubleTapTimeout.current) clearTimeout(doubleTapTimeout.current);
      if (!isLiked) {
        toggleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
      }
      return;
    }

    // Single tap — toggle play/pause (delayed for double-tap detection)
    doubleTapTimeout.current = setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      if (el.paused) {
        el.play().catch(() => {});
        setIsPaused(false);
      } else {
        el.pause();
        setIsPaused(true);
      }
      setShowPlayIcon(true);
      if (playIconTimeout.current) clearTimeout(playIconTimeout.current);
      playIconTimeout.current = setTimeout(() => setShowPlayIcon(false), 600);
    }, 300);
  }, [isLiked, toggleLike]);

  const handleMuteTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      onToggleMute();
    },
    [onToggleMute]
  );

  const handleArtistTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (onCloseFeedForNavigation) {
        onCloseFeedForNavigation();
      } else {
        onClose();
      }
      navigate(`/artist/${video.artistUserId}`);
    },
    [navigate, video.artistUserId, onClose, onCloseFeedForNavigation]
  );

  const handleLike = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (!user) {
        toast.error("Please sign in to like videos");
        return;
      }
      toggleLike();
    },
    [user, toggleLike]
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      const shareUrl = `${window.location.origin}/artist/${video.artistUserId}?video=${video.id}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: `${video.artistName} on FlyMusic`,
            text: video.caption || `Check out this video by ${video.artistName}`,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied!");
        }
      } catch {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied!");
        } catch {
          // Ignore
        }
      }
    },
    [video]
  );

  const handleCommentSheetChange = useCallback(
    (open: boolean) => {
      commentSheetOpenRef.current = open;
      onCommentSheetChange?.(open);
    },
    [onCommentSheetChange]
  );

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div
      className="relative h-[100dvh] w-full snap-start snap-always flex-shrink-0 bg-black touch-manipulation"
      onClick={handleTap}
    >
      {/* Fallback placeholder when no thumbnail */}
      {!video.thumbnailUrl && !videoReady && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <Avatar className="h-20 w-20 ring-2 ring-white/10">
            <AvatarImage src={video.artistAvatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {video.artistName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Thumbnail — shown until video is ready */}
      {video.thumbnailUrl && !videoReady && (
        <img
          src={video.thumbnailUrl}
          alt={video.caption || "Video"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl || undefined}
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          !videoReady && "opacity-0"
        )}
        muted={isMuted}
        loop
        playsInline
        webkit-playsinline="true"
        preload="auto"
        onCanPlay={() => setVideoReady(true)}
      />

      {/* Play/Pause icon flash */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center animate-scale-in">
            {isPaused ? (
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Double-tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-scale-in" />
        </div>
      )}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Mute button — top right */}
      <button
        onClick={handleMuteTap}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleMuteTap(e);
        }}
        className="absolute top-14 right-4 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center touch-manipulation"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Right-side action bar */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-5 z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Like */}
        <button
          onClick={handleLike}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleLike(e);
          }}
          className="flex flex-col items-center gap-1 touch-manipulation"
          aria-label="Like"
        >
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center",
              isLiked ? "bg-red-500/20" : "bg-black/40"
            )}
          >
            <Heart
              className={cn(
                "w-6 h-6",
                isLiked ? "text-red-500 fill-red-500" : "text-white"
              )}
            />
          </div>
          <span className="text-white text-xs font-medium">
            {formatCount(likeCount)}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleShare(e);
          }}
          className="flex flex-col items-center gap-1 touch-manipulation"
          aria-label="Share"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Comments */}
        <VideoCommentSheet
          videoId={video.id}
          artistId={video.artistId}
          onOpenChange={handleCommentSheetChange}
        />
      </div>

      {/* Bottom info — artist + caption with fade preview */}
      <VideoCaption
        caption={video.caption}
        artistName={video.artistName}
        artistAvatar={video.artistAvatar}
        artistUserId={video.artistUserId}
        onArtistTap={handleArtistTap}
        onExpandedChange={onCaptionExpandedChange}
      />
    </div>
  );
}
