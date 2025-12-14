import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Share2, MessageSquare } from "lucide-react";
import { VideoShareModal } from "@/components/video/VideoShareModal";
import { VideoCommentsSection } from "@/components/video/VideoCommentsSection";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";

interface VideoPostCardProps {
  videoId: string;
  videoUrl: string;
  caption: string | null;
  createdAt: string;
  artist: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export function VideoPostCard({ videoId, videoUrl, caption, createdAt, artist }: VideoPostCardProps) {
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { trackView } = useVideoAnalytics({ videoId });

  useEffect(() => {
    const trackViewing = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await trackView(user?.id);
    };
    trackViewing();
  }, [videoId, trackView]);

  // Safety check for artist data
  if (!artist || !artist.user_id) {
    return null;
  }

  return (
    <div className="video-card-gold-outer shadow-lg hover:shadow-xl transition-all w-full max-w-full overflow-hidden">
      <div className="video-card-gold-inner w-full max-w-full overflow-hidden">
        {/* Artist Header */}
        <div className="p-5 md:p-4 flex items-center gap-4 md:gap-3 bg-card/50 backdrop-blur-sm">
          <Link to={`/artist/${artist.user_id}`}>
            <Avatar className="h-14 w-14 md:h-12 md:w-12 border-2 border-primary/30 hover:border-primary/60 transition-colors flex-shrink-0">
              <AvatarImage src={artist.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg md:text-base">
                {artist.artist_name?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              to={`/artist/${artist.user_id}`}
              className="font-semibold text-lg md:text-base hover:text-primary transition-colors block truncate"
            >
              {artist.artist_name}
            </Link>
            <p className="text-sm md:text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Premium Video Player with Containment */}
        <div className="w-full max-w-full overflow-hidden">
          <PremiumVideoPlayer 
            videoUrl={videoUrl}
            autoPlay={false}
            loop={true}
            showFrame={false}
            enableVisibilityAutoplay={true}
          />
        </div>

        {/* Caption */}
        {caption && (
          <div className="px-5 md:px-4 pt-2 pb-4 md:pb-3">
            <p className="text-base md:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{caption}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 md:px-4 pb-5 md:pb-4 flex gap-3 md:gap-2 border-t border-border/50 pt-4 md:pt-3">
          <Button
            variant="ghost"
            size="default"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 h-11 md:h-9 px-4 md:px-3"
          >
            <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
            <span className="text-base md:text-sm">Comments</span>
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => setShowShare(true)}
            className="gap-2 h-11 md:h-9 px-4 md:px-3"
          >
            <Share2 className="w-5 h-5 md:w-4 md:h-4" />
            <span className="text-base md:text-sm">Share</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 pb-4 border-t border-border/50 pt-4">
            <VideoCommentsSection videoId={videoId} artistId={artist.id} />
          </div>
        )}
      </div>

      {showShare && (
        <VideoShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          video={{ id: videoId, caption }}
          artist={artist}
        />
      )}
    </div>
  );
}
