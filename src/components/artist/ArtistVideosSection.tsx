import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Video } from "lucide-react";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
}

interface ArtistVideosSectionProps {
  artistId: string;
}

export function ArtistVideosSection({ artistId }: ArtistVideosSectionProps) {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Card 
            key={video.id} 
            className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all shadow-sm"
          >
            <video
              src={video.video_url}
              controls
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
            {video.caption && (
              <div className="p-3">
                <p className="text-sm text-foreground/80 line-clamp-2">
                  {video.caption}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
