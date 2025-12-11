import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Play } from "lucide-react";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";
import { useSupporterAccess } from "@/hooks/useSupporterAccess";
import { LockedContentOverlay } from "@/components/supporter/LockedContentOverlay";
import { SupporterExclusiveBadge } from "@/components/supporter/SupporterExclusiveBadge";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
}

interface VideoCardProps {
  video: VideoPost;
  index: number;
  artistId: string;
  onOpenFullscreen: (index: number) => void;
  onShare: (video: VideoPost) => void;
  onUnlock: () => void;
}

export function VideoCard({
  video,
  index,
  artistId,
  onOpenFullscreen,
  onShare,
  onUnlock,
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { hasAccess, loading: accessLoading } = useSupporterAccess(
    artistId,
    video.is_supporter_only ? video.required_tier : null
  );

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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!hasAccess && video.is_supporter_only) {
      onUnlock();
      return;
    }
    
    // Start playing inline or open fullscreen
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // If autoplay fails, open fullscreen (iOS Safari requirement)
        onOpenFullscreen(index);
      });
    } else {
      onOpenFullscreen(index);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="cursor-pointer group relative rounded-2xl overflow-hidden"
        onClick={handleVideoClick}
      >
        {/* Video element with proper mobile attributes */}
        <video
          ref={videoRef}
          src={video.video_url}
          className={`w-full aspect-video object-cover ${video.is_supporter_only && !hasAccess ? 'blur-sm' : ''}`}
          playsInline
          muted={!isPlaying}
          loop
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Play button overlay - always visible when not playing */}
        {!isPlaying && hasAccess && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
            onClick={handlePlayClick}
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-background fill-background ml-1" />
            </div>
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

      <div className="flex justify-end px-2">
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