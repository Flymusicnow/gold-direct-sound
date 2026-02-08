import { Lock, Play } from "lucide-react";

interface Video {
  id: string;
  thumbnail_url: string | null;
  caption: string | null;
}

interface PreviewVideoGridProps {
  videos: Video[];
}

export function PreviewVideoGrid({ videos }: PreviewVideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No videos available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div 
          key={video.id}
          className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-not-allowed isolate"
          style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
        >
          {/* Thumbnail */}
          {video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={video.caption || 'Video'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Play className="h-8 w-8 text-primary/50" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Lock className="h-6 w-6 text-white mb-2" />
            <span className="text-xs text-white font-medium">Join beta to watch</span>
          </div>
          
          {/* Caption */}
          {video.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-xs text-white truncate">{video.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
