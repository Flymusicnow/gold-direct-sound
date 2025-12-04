import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";
import { ArrowLeft, Loader2, FolderOpen, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface VideoItem {
  id: string;
  video_id: string;
  position: number;
  video: {
    id: string;
    video_url: string;
    caption: string | null;
    thumbnail_url: string | null;
    created_at: string;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  artist_id: string;
  artist: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export default function VideoCollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    if (collectionId) {
      fetchCollectionData();
    }
  }, [collectionId]);

  const fetchCollectionData = async () => {
    try {
      // Fetch collection with artist info
      const { data: collectionData, error: collectionError } = await supabase
        .from("video_collections")
        .select(`
          *,
          artist:artist_profiles!video_collections_artist_id_fkey(
            id,
            user_id,
            artist_name,
            avatar_url
          )
        `)
        .eq("id", collectionId)
        .single();

      if (collectionError) throw collectionError;
      setCollection(collectionData);

      // Fetch videos in collection
      const { data: videoItems, error: videosError } = await supabase
        .from("video_collection_items")
        .select(`
          id,
          video_id,
          position,
          video:artist_video_posts!video_collection_items_video_id_fkey(
            id,
            video_url,
            caption,
            thumbnail_url,
            created_at
          )
        `)
        .eq("collection_id", collectionId)
        .order("position", { ascending: true });

      if (videosError) throw videosError;
      setVideos(videoItems || []);
    } catch (error) {
      console.error("Error fetching collection:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <FolderOpen className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Collection not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const currentVideo = videos[selectedVideoIndex]?.video;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{collection.name}</h1>
              <Link 
                to={`/artist/${collection.artist.user_id}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {collection.artist.artist_name}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {videos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos in this collection</h3>
              <p className="text-muted-foreground text-center">
                This collection doesn't have any videos yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Video Player */}
            <div className="lg:col-span-2 space-y-4">
              {currentVideo && (
                <>
                  <div className="rounded-xl overflow-hidden border border-border/50">
                    <PremiumVideoPlayer
                      videoUrl={currentVideo.video_url}
                      showFrame={false}
                    />
                  </div>
                  {currentVideo.caption && (
                    <p className="text-muted-foreground">{currentVideo.caption}</p>
                  )}
                </>
              )}
            </div>

            {/* Video List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
              </h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {videos.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedVideoIndex(index)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      selectedVideoIndex === index
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-muted shrink-0">
                      {item.video.thumbnail_url ? (
                        <img
                          src={item.video.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {selectedVideoIndex === index && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {item.video.caption || `Video ${index + 1}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collection Description */}
        {collection.description && (
          <div className="mt-8 p-4 rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-2">About this collection</h3>
            <p className="text-muted-foreground">{collection.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
