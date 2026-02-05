import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { CompactVideoCard } from "./CompactVideoCard";
import { StaggeredList } from "@/components/ui/StaggeredList";

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
        {videos.map((video) => (
          <CompactVideoCard
            key={video.id}
            videoId={video.id}
            videoUrl={video.video_url}
            thumbnailUrl={video.thumbnail_url}
            caption={video.caption}
            createdAt={video.created_at}
            artist={video.artist_profiles}
          />
        ))}
      </StaggeredList>
    </div>
  );
}
