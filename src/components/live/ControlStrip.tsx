import { Link } from "react-router-dom";
import { ArrowLeft, Users, Radio, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveViewerCount } from "@/components/artist/LiveViewerCount";
import { cn } from "@/lib/utils";

interface LiveStreamData {
  id: string;
  title: string;
  status: string;
  stream_mode?: string;
  artist_profiles?: {
    artist_name: string;
    avatar_url?: string;
    user_id: string;
  };
}

interface ControlStripProps {
  stream: LiveStreamData;
  isArtist: boolean;
  onEndStream?: () => void;
  className?: string;
}

/**
 * ControlStrip - Stream controls and session info
 * Never overlaps the Stage zone
 * Contains: Back button, stream info, viewer count, artist controls
 */
export function ControlStrip({ 
  stream, 
  isArtist, 
  onEndStream,
  className 
}: ControlStripProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      {/* Left: Back + Stream Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link to="/">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 min-w-0">
          {stream.artist_profiles && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={stream.artist_profiles.avatar_url} />
              <AvatarFallback>
                {stream.artist_profiles.artist_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500 text-white text-xs animate-pulse flex-shrink-0">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
              <span className="text-sm font-medium truncate">
                {stream.title}
              </span>
            </div>
            {stream.artist_profiles && (
              <p className="text-xs text-muted-foreground truncate">
                {stream.artist_profiles.artist_name}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Right: Viewer Count + Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <LiveViewerCount streamId={stream.id} />
        
        {isArtist && (
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
        
        {isArtist && onEndStream && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onEndStream}
          >
            End Stream
          </Button>
        )}
      </div>
    </div>
  );
}
