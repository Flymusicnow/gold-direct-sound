import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamConnectingPlaceholder } from "./StreamConnectingPlaceholder";

interface P2PVideoPlayerProps {
  stream: MediaStream | null;
  connectionState: 'connecting' | 'connected' | 'failed' | 'disconnected';
  error: string | null;
  onRetry: () => void;
  artistName?: string;
  artistAvatar?: string;
  className?: string;
}

/**
 * P2PVideoPlayer - Displays a WebRTC remote stream
 * Handles connection states and provides retry functionality
 */
export function P2PVideoPlayer({
  stream,
  connectionState,
  error,
  onRetry,
  artistName,
  artistAvatar,
  className,
}: P2PVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Connecting state
  if (connectionState === 'connecting') {
    return (
      <div className={cn("relative", className)}>
        <StreamConnectingPlaceholder
          artistName={artistName}
          artistAvatar={artistAvatar}
        />
        {/* Connection status indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-primary/30">
          <Wifi className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm text-white">Connecting to artist stream...</span>
        </div>
      </div>
    );
  }

  // Failed state
  if (connectionState === 'failed' || error) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-black",
          className
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="text-destructive font-medium">Connection Failed</p>
            <p className="text-sm text-muted-foreground">
              {error || "Unable to connect to the stream"}
            </p>
          </div>
          <Button
            onClick={onRetry}
            variant="outline"
            className="min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Disconnected state (waiting to reconnect)
  if (connectionState === 'disconnected' && !stream) {
    return (
      <StreamConnectingPlaceholder
        artistName={artistName}
        artistAvatar={artistAvatar}
        className={className}
      />
    );
  }

  // Connected with stream
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-black relative",
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-full max-h-full object-contain"
      />
      
      {/* Connection quality indicator */}
      {connectionState === 'connected' && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-xs text-white">P2P</span>
        </div>
      )}
    </div>
  );
}
