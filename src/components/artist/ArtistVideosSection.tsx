import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";
import { Button } from "@/components/ui/button";
import { Share2, Video } from "lucide-react";
import { VideoShareModal } from "@/components/video/VideoShareModal";
import { VideoFullscreenModal } from "./VideoFullscreenModal";
import { EmptyStateCard } from "./EmptyStateCard";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
}

interface ArtistVideosSectionProps {
  artistId: string;
  artistName: string;
}

export function ArtistVideosSection({ artistId, artistName }: ArtistVideosSectionProps) {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareVideo, setShareVideo] = useState<VideoPost | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<{
    index: number;
    url: string;
  } | null>(null);

  useEffect(() => {
    fetchVideos();
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
          <div key={video.id} className="space-y-3">
            <div
              className="cursor-pointer group relative"
              onClick={() => handleOpenFullscreen(index)}
            >
              <PremiumVideoPlayer
                videoUrl={video.video_url}
                autoPlay={false}
                loop
                showFrame
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
            </div>

            {video.caption && (
              <p className="text-sm text-muted-foreground px-2">{video.caption}</p>
            )}

            <div className="flex justify-end px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareVideo(video)}
                className="text-primary hover:text-primary/80"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
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
