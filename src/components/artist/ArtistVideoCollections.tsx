import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoCollectionCard } from "@/components/video/VideoCollectionCard";
import { FolderOpen } from "lucide-react";

interface VideoCollection {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  video_count?: number;
}

interface ArtistVideoCollectionsProps {
  artistId: string;
  artistUserId: string;
}

export function ArtistVideoCollections({ artistId, artistUserId }: ArtistVideoCollectionsProps) {
  const [collections, setCollections] = useState<VideoCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [artistId]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("video_collections")
        .select(`
          *,
          video_collection_items(count)
        `)
        .eq("artist_id", artistId)
        .order("position", { ascending: true });

      if (error) throw error;

      const collectionsWithCounts = (data || []).map(collection => ({
        ...collection,
        video_count: collection.video_collection_items?.[0]?.count || 0,
      }));

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Video Collections</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <VideoCollectionCard
            key={collection.id}
            collection={collection}
            artistUserId={artistUserId}
          />
        ))}
      </div>
    </div>
  );
}
