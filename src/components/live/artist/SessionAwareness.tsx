import { Clock, Users, Heart, Wifi, WifiOff } from "lucide-react";
import { useLiveDuration } from "@/hooks/useLiveDuration";
import { useConnectionHealth, ConnectionQuality } from "@/hooks/useConnectionHealth";
import { cn } from "@/lib/utils";

interface SessionAwarenessProps {
  streamStartTime: string | null;
  isLive: boolean;
  viewerCount: number;
  sessionSupportTotal?: number;
  className?: string;
}

const ConnectionBars = ({ quality }: { quality: ConnectionQuality }) => {
  const bars = {
    excellent: 4,
    good: 3,
    fair: 2,
    poor: 1,
    disconnected: 0,
  }[quality];

  const color = {
    excellent: "bg-green-500",
    good: "bg-green-500",
    fair: "bg-yellow-500",
    poor: "bg-red-500",
    disconnected: "bg-muted",
  }[quality];

  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-sm transition-colors",
            i <= bars ? color : "bg-muted/30"
          )}
          style={{ height: `${i * 25}%` }}
        />
      ))}
    </div>
  );
};

export const SessionAwareness = ({
  streamStartTime,
  isLive,
  viewerCount,
  sessionSupportTotal = 0,
  className,
}: SessionAwarenessProps) => {
  const { formatted: duration } = useLiveDuration(streamStartTime, isLive);
  const { quality, label } = useConnectionHealth();

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground", className)}>
      {/* Live Duration */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        <span className="tabular-nums font-medium">{duration}</span>
      </div>

      {/* Viewer Count */}
      <div className="flex items-center gap-1.5">
        <Users className="h-4 w-4" />
        <span className="tabular-nums">{viewerCount.toLocaleString()}</span>
      </div>

      {/* Session Support */}
      {sessionSupportTotal > 0 && (
        <div className="flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-pink-500" />
          <span className="tabular-nums">{sessionSupportTotal}</span>
        </div>
      )}

      {/* Connection Health */}
      <div className="flex items-center gap-1.5" title={`Connection: ${label}`}>
        {quality === "disconnected" ? (
          <WifiOff className="h-4 w-4 text-red-500" />
        ) : (
          <Wifi className="h-4 w-4" />
        )}
        <ConnectionBars quality={quality} />
      </div>
    </div>
  );
};
