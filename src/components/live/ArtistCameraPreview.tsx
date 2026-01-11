import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { VideoOff, Mic, MicOff } from "lucide-react";

interface ArtistCameraPreviewProps {
  stream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  error?: string | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * ArtistCameraPreview - Displays the artist's local camera feed
 * Uses object-fit: contain to prevent cropping (per SafeVideoStage rules)
 */
export function ArtistCameraPreview({
  stream,
  isMuted,
  isCameraOff,
  error,
  isLoading,
  className,
}: ArtistCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-black",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Starting camera...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-black",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center px-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <VideoOff className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-destructive font-medium">Camera Error</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // No stream yet
  if (!stream) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-black",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
            <VideoOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Camera not started
          </p>
        </div>
      </div>
    );
  }

  // Camera off state (stream exists but video track disabled)
  if (isCameraOff) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-black relative",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
            <VideoOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Camera is off</p>
        </div>
        
        {/* Mute indicator */}
        {isMuted && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
            <MicOff className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive">Muted</span>
          </div>
        )}
      </div>
    );
  }

  // Active video feed
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
        muted // Local preview is always muted to prevent audio feedback
        className="max-w-full max-h-full object-contain"
      />
      
      {/* Mute indicator overlay */}
      {isMuted && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
          <MicOff className="h-4 w-4 text-destructive" />
          <span className="text-xs text-destructive">Muted</span>
        </div>
      )}
      
      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-xs text-white font-medium">LIVE</span>
      </div>
    </div>
  );
}
