import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Share2 } from "lucide-react";
import { VideoShareModal } from "@/components/video/VideoShareModal";

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

  useEffect(() => {
    fetchVideos();
  }, [artistId]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_video_posts")
        .select("*")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <Video className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Videos</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="aspect-video animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Videos</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="video-card-gold-outer hover:shadow-lg transition-all"
          >
            <div className="video-card-gold-inner">
              <video
                src={video.video_url}
                controls
                className="w-full aspect-video bg-black"
                preload="metadata"
              />
              <div className="p-3 space-y-2">
                {video.caption && (
                  <p className="text-sm text-foreground/80 line-clamp-2">
                    {video.caption}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShareVideo(video)}
                  className="gap-2 w-full"
                >
                  <Share2 className="w-3 h-3" />
                  Share Video
                </Button>
              </div>
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
    </div>
  );
}
