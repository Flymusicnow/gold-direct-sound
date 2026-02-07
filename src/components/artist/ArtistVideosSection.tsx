import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Video } from "lucide-react";
import { EmptyStateCard } from "./EmptyStateCard";
import { BecomeASupporterModal } from "@/components/supporter/BecomeASupporterModal";
import { VideoCard } from "./VideoCard";
import { FullScreenVideoFeed } from "@/components/video/FullScreenVideoFeed";
import { useFullScreenVideoFeed, type FeedVideo } from "@/hooks/useFullScreenVideoFeed";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  thumbnail_url?: string | null;
}

interface ArtistVideosSectionProps {
  artistId: string;
  artistName: string;
  artistAvatar?: string | null;
  artistUserId?: string;
}

export function ArtistVideosSection({ artistId, artistName, artistAvatar, artistUserId }: ArtistVideosSectionProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const feed = useFullScreenVideoFeed();

  useEffect(() => {
    fetchVideos();
    fetchArtistSettings();
  }, [artistId]);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("artist_video_posts")
      .select("*, like_count")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const fetchArtistSettings = async () => {
    const { data } = await supabase
      .from("artist_profiles")
      .select("video_autoplay_enabled")
      .eq("id", artistId)
      .maybeSingle();
    
    setAutoplayEnabled(data?.video_autoplay_enabled ?? true);
  };

  const handleOpenFullscreen = (index: number) => {
    const feedVideos: FeedVideo[] = videos.map(v => ({
      id: v.id,
      videoUrl: v.video_url,
      thumbnailUrl: v.thumbnail_url || null,
      caption: v.caption,
      artistId: artistId,
      artistUserId: artistUserId || artistId,
      artistName: artistName,
      artistAvatar: artistAvatar || null,
      isSupporterOnly: v.is_supporter_only,
      requiredTier: v.required_tier,
      likeCount: (v as any).like_count ?? 0,
    }));
    feed.openFeed(feedVideos, index);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[9/16] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyStateCard
        icon={Video}
        title="No Videos Yet"
        description="This artist hasn't uploaded any videos yet. Check back soon!"
        ctaText="Explore Other Artists"
        ctaPath="/explore"
        variant="gold"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            index={index}
            artistId={artistId}
            autoplayEnabled={autoplayEnabled}
            onOpenFullscreen={handleOpenFullscreen}
            onShare={() => {}}
            onUnlock={() => setShowSupporterModal(true)}
          />
        ))}
      </div>

      <BecomeASupporterModal
        open={showSupporterModal}
        onOpenChange={setShowSupporterModal}
        artistId={artistId}
        artistName={artistName}
      />

      {feed.isOpen && (
        <FullScreenVideoFeed
          videos={feed.videos}
          initialIndex={feed.initialIndex}
          onClose={feed.closeFeed}
        />
      )}
    </>
  );
}
