import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface VideoPostCardProps {
  videoUrl: string;
  caption: string | null;
  createdAt: string;
  artist: {
    id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export function VideoPostCard({ videoUrl, caption, createdAt, artist }: VideoPostCardProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all shadow-sm">
      {/* Artist Info */}
      <div className="p-4 flex items-center gap-3">
        <Link to={`/artist/${artist.id}`}>
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={artist.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {artist.artist_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link 
            to={`/artist/${artist.id}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {artist.artist_name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Video */}
      <div 
        className="relative bg-black cursor-pointer"
        onClick={() => setIsMuted(!isMuted)}
      >
        <video
          src={videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full aspect-video object-cover"
        />
        {isMuted && (
          <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs text-white">
            Tap to unmute
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="p-4">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{caption}</p>
        </div>
      )}
    </Card>
  );
}
