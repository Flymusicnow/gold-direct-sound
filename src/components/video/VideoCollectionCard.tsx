import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video } from "lucide-react";
import { Link } from "react-router-dom";

interface VideoCollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    cover_url: string | null;
    video_count?: number;
  };
  artistUserId: string;
}

export function VideoCollectionCard({ collection, artistUserId }: VideoCollectionCardProps) {
  return (
    <Link to={`/collections/${collection.id}`}>
      <Card className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden">
        <div className="relative aspect-video bg-gradient-to-br from-primary/5 to-primary/10">
          {collection.cover_url ? (
            <img
              src={collection.cover_url}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Video className="w-16 h-16 text-primary/40" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-background fill-current ml-1" />
            </div>
          </div>

          {collection.video_count !== undefined && (
            <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
              {collection.video_count} videos
            </Badge>
          )}
        </div>

        <CardHeader className="p-4">
          <CardTitle className="text-lg line-clamp-1">{collection.name}</CardTitle>
          {collection.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
