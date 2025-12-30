import { Lock } from "lucide-react";

interface Track {
  id: string;
  title: string;
  cover_url: string | null;
}

interface PreviewTrackListProps {
  tracks: Track[];
}

export function PreviewTrackList({ tracks }: PreviewTrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tracks available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track, index) => (
        <div 
          key={track.id}
          className="group relative flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          {/* Track number */}
          <span className="w-6 text-center text-sm text-muted-foreground">
            {index + 1}
          </span>
          
          {/* Cover art */}
          <div className="relative w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
            {track.cover_url ? (
              <img 
                src={track.cover_url} 
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs text-primary">♪</span>
              </div>
            )}
            
            {/* Lock overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Lock className="h-4 w-4 text-white" />
            </div>
          </div>
          
          {/* Track title */}
          <span className="font-medium truncate flex-1">
            {track.title}
          </span>
          
          {/* Locked indicator */}
          <Lock className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
