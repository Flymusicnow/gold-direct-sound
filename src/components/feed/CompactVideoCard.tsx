import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CompactVideoCardProps {
  videoId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: string;
  artist: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export function CompactVideoCard({
  videoId,
  videoUrl,
  thumbnailUrl,
  caption,
  createdAt,
  artist,
}: CompactVideoCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleArtistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/artist/${artist.user_id}`);
  };

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-card border border-border cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {/* Could open fullscreen modal */}}
    >
      {/* Video Container - 9:16 aspect ratio */}
      <div className="relative aspect-[9/16] bg-muted">
        {/* Video element - hidden until playing */}
        <video
          ref={videoRef}
          src={videoUrl}
          className={cn(
            "w-full h-full object-cover",
            !isPlaying && thumbnailUrl && "opacity-0 absolute inset-0"
          )}
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          poster={thumbnailUrl || undefined}
        />

        {/* Thumbnail overlay - shown when not playing */}
        {thumbnailUrl && !isPlaying && (
          <img
            src={thumbnailUrl}
            alt={caption || 'Video thumbnail'}
            className="w-full h-full object-cover"
          />
        )}

        {/* Fallback skeleton when no thumbnail */}
        {!thumbnailUrl && !isPlaying && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Play overlay when not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Mute button */}
        {isHovered && (
          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center transition-opacity"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 space-y-2">
        {/* Artist Row */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
          onClick={handleArtistClick}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={artist.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {artist.artist_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate flex-1">
            {artist.artist_name}
          </span>
        </div>

        {/* Caption - truncated */}
        {caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {caption}
          </p>
        )}

        {/* Time */}
        <p className="text-xs text-muted-foreground">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
