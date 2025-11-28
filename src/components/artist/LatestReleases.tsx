import { Card } from "@/components/ui/card";
import { Music, Play, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "./EmptyStateCard";

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
  if (tracks.length === 0) {
    return (
      <EmptyStateCard
        icon={Music}
        title="No tracks yet"
        description="Upload your first song and start building your music catalog."
        ctaText="Upload Track"
        ctaPath="/studio/tracks"
        variant="gold"
      />
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
      <h3 className="text-lg font-semibold mb-4">Latest Releases</h3>
      <div className="space-y-3">
        {tracks.slice(0, 5).map((track) => (
          <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/50">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
              {track.cover_url ? (
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate mb-1">{track.title}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3 text-primary" />
                  {track.play_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-primary" />
                  {likes[track.id] || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-primary" />
                  {comments[track.id] || 0}
                </span>
              </div>
            </div>
            {onPlay && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onPlay(track)}
                className="flex-shrink-0 hover:bg-primary/10 hover:text-primary"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
