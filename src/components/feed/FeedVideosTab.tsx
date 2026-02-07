import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { CompactVideoCard } from "./CompactVideoCard";
import { StaggeredList } from "@/components/ui/StaggeredList";
import { FullScreenVideoFeed } from "@/components/video/FullScreenVideoFeed";
import { useFullScreenVideoFeed, type FeedVideo } from "@/hooks/useFullScreenVideoFeed";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  thumbnail_url: string | null;
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

interface FeedVideosTabProps {
  videos: VideoPost[];
}

export function FeedVideosTab({ videos }: FeedVideosTabProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const feed = useFullScreenVideoFeed();

  const handleVideoTap = (index: number) => {
    const feedVideos: FeedVideo[] = videos.map(v => ({
      id: v.id,
      videoUrl: v.video_url,
      thumbnailUrl: v.thumbnail_url,
      caption: v.caption,
      artistId: v.artist_profiles.id,
      artistUserId: v.artist_profiles.user_id,
      artistName: v.artist_profiles.artist_name,
      artistAvatar: v.artist_profiles.avatar_url,
      likeCount: (v as any).like_count ?? 0,
    }));
    feed.openFeed(feedVideos, index);
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('fan.noVideosYet')}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {t('fan.followArtistsToSeeVideos')}
        </p>
        <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
          {t('fan.discoverArtists')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('fan.videosFromYourArtists')}
      </p>
      
      {/* Video Grid - 2 columns on mobile, 2-3 on larger screens */}
      <StaggeredList 
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" 
        staggerDelay={0.06}
      >
        {videos.map((video, index) => (
          <CompactVideoCard
            key={video.id}
            videoId={video.id}
            videoUrl={video.video_url}
            thumbnailUrl={video.thumbnail_url}
            caption={video.caption}
            createdAt={video.created_at}
            likeCount={(video as any).like_count ?? 0}
            artist={video.artist_profiles}
            onTap={() => handleVideoTap(index)}
          />
        ))}
      </StaggeredList>

      {feed.isOpen && (
        <FullScreenVideoFeed
          videos={feed.videos}
          initialIndex={feed.initialIndex}
          onClose={feed.closeFeed}
        />
      )}
    </div>
  );
}
