import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

interface StreamConnectingPlaceholderProps {
  artistName?: string;
  artistAvatar?: string;
  className?: string;
}

/**
 * StreamConnectingPlaceholder - Friendly waiting screen for fans
 * Shown when the stream is live but no HLS URL is available yet
 */
export function StreamConnectingPlaceholder({
  artistName,
  artistAvatar,
  className,
}: StreamConnectingPlaceholderProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-black",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6 text-center px-6 max-w-sm">
        {/* Artist avatar with pulse animation */}
        <div className="relative">
          {artistAvatar ? (
            <img
              src={artistAvatar}
              alt={artistName || "Artist"}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30">
              <span className="text-3xl font-bold text-primary">
                {artistName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-500">LIVE</span>
        </div>

        {/* Connecting message */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Connecting to stream
            <span className="inline-flex ml-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {artistName
              ? `Please wait while we connect you to ${artistName}'s live stream`
              : "Please wait while we connect you to the live stream"}
          </p>
        </div>

        {/* Loading spinner */}
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />

        {/* Helpful tip */}
        <p className="text-xs text-muted-foreground/70 mt-4">
          This usually takes just a few seconds
        </p>
      </div>
    </div>
  );
}
