import { Card, CardContent } from "@/components/ui/card";
import { Music, Lock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlaylistCardProps {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  trackCount: number;
  coverUrl?: string | null;
}

export default function PlaylistCard({
  id,
  name,
  description,
  isPublic,
  trackCount,
  coverUrl,
}: PlaylistCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/fan/playlists/${id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{name}</h3>
              {isPublic ? (
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {description}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {trackCount} {trackCount === 1 ? "track" : "tracks"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
