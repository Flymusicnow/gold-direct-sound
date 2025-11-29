import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
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
  const { hasAccess, loading: accessLoading } = useSupporterAccess(
    artistId,
    video.is_supporter_only ? video.required_tier : null
  );

  return (
    <div className="space-y-3">
      <div
        className="cursor-pointer group relative"
        onClick={() => hasAccess && onOpenFullscreen(index)}
      >
        <PremiumVideoPlayer videoUrl={video.video_url} autoPlay={false} loop showFrame />

        {video.is_supporter_only && !hasAccess && !accessLoading && (
          <LockedContentOverlay
            requiredTier={video.required_tier as "basic" | "gold"}
            onUnlock={onUnlock}
          />
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
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
          onClick={() => onShare(video)}
          className="text-primary hover:text-primary/80"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
