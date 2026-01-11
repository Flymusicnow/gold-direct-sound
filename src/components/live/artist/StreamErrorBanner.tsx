import { useEffect, useState } from "react";
import { AlertCircle, Wifi, WifiOff, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorType = "connection" | "fan_join_failed" | "stream_error" | "generic";

interface StreamErrorBannerProps {
  type: ErrorType;
  message: string;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

const errorConfig: Record<ErrorType, { icon: typeof AlertCircle; bgColor: string }> = {
  connection: {
    icon: WifiOff,
    bgColor: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  },
  fan_join_failed: {
    icon: AlertCircle,
    bgColor: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  },
  stream_error: {
    icon: AlertCircle,
    bgColor: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  },
  generic: {
    icon: AlertCircle,
    bgColor: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  },
};

export const StreamErrorBanner = ({
  type,
  message,
  autoDismiss = true,
  autoDismissDelay = 5000,
  onDismiss,
  onRetry,
  className,
}: StreamErrorBannerProps) => {
  const [visible, setVisible] = useState(true);
  const config = errorConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoDismiss && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
        config.bgColor,
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="p-1 hover:bg-black/10 rounded transition-colors"
          title="Retry"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
      
      <button
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="p-1 hover:bg-black/10 rounded transition-colors"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// Stream Paused Overlay for viewers
export const StreamPausedOverlay = ({ artistName }: { artistName?: string }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
          <Wifi className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Stream Paused</h3>
          <p className="text-muted-foreground">
            {artistName ? `${artistName} will be right back` : "The artist will be right back"}
          </p>
        </div>
      </div>
    </div>
  );
};
