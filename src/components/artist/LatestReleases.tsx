import { Card } from "@/components/ui/card";
import { Music, Play, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  title: string;
  cover_url: string | null;
  play_count: number | null;
}

interface LatestReleasesProps {
  tracks: Track[];
  likes: Record<string, number>;
  comments: Record<string, number>;
  onPlay?: (track: Track) => void;
}

export function LatestReleases({ tracks, likes, comments, onPlay }: LatestReleasesProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Latest Releases</h3>
      {tracks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tracks uploaded yet. Upload your first track to get started!</p>
      ) : (
        <div className="space-y-3">
          {tracks.slice(0, 5).map((track) => (
            <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {track.cover_url ? (
                  <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {track.play_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {likes[track.id] || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {comments[track.id] || 0}
                  </span>
                </div>
              </div>
              {onPlay && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onPlay(track)}
                  className="flex-shrink-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
