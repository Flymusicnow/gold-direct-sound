import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Video } from "lucide-react";
import { VideoShareModal } from "@/components/video/VideoShareModal";
import { VideoFullscreenModal } from "./VideoFullscreenModal";
import { EmptyStateCard } from "./EmptyStateCard";
import { BecomeASupporterModal } from "@/components/supporter/BecomeASupporterModal";
import { VideoCard } from "./VideoCard";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
}

interface ArtistVideosSectionProps {
  artistId: string;
  artistName: string;
}

export function ArtistVideosSection({ artistId, artistName }: ArtistVideosSectionProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareVideo, setShareVideo] = useState<VideoPost | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<{
    index: number;
    url: string;
  } | null>(null);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  useEffect(() => {
    fetchVideos();
    fetchArtistSettings();
  }, [artistId]);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("artist_video_posts")
      .select("*")
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
    setFullscreenVideo({ index, url: videos[index].video_url });
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (!fullscreenVideo) return;

    const newIndex =
      direction === "prev"
        ? Math.max(0, fullscreenVideo.index - 1)
        : Math.min(videos.length - 1, fullscreenVideo.index + 1);

    setFullscreenVideo({ index: newIndex, url: videos[newIndex].video_url });
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
            onShare={setShareVideo}
            onUnlock={() => setShowSupporterModal(true)}
          />
        ))}
      </div>

      {shareVideo && (
        <VideoShareModal
          isOpen={!!shareVideo}
          onClose={() => setShareVideo(null)}
          video={shareVideo}
          artist={{
            id: artistId,
            artist_name: artistName,
          }}
        />
      )}

      <BecomeASupporterModal
        open={showSupporterModal}
        onOpenChange={setShowSupporterModal}
        artistId={artistId}
        artistName={artistName}
      />

      {fullscreenVideo && (
        <VideoFullscreenModal
          isOpen={!!fullscreenVideo}
          onClose={() => setFullscreenVideo(null)}
          currentVideoUrl={fullscreenVideo.url}
          videos={videos}
          currentIndex={fullscreenVideo.index}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}
