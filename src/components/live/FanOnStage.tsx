import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FanOnStageProps {
  artistVideoRef: React.RefObject<HTMLVideoElement>;
  fanStream: MediaStream | null;
  layout: 'split' | 'pip';
  pipPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * FanOnStage - Split-screen or PiP layout for fan-on-stage
 * Per SUPER CARD:
 * - Artist video always has priority
 * - Both faces always fully visible (letterboxing if needed)
 * - PiP snaps to approved corners only
 */
export function FanOnStage({
  artistVideoRef,
  fanStream,
  layout,
  pipPosition = 'bottom-right',
  className,
}: FanOnStageProps) {
  const fanVideoRef = useRef<HTMLVideoElement>(null);

  // Attach fan stream to video element
  useEffect(() => {
    if (fanVideoRef.current && fanStream) {
      fanVideoRef.current.srcObject = fanStream;
    }
  }, [fanStream]);

  const pipPositionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (layout === 'split') {
    return (
      <div className={cn("w-full h-full grid grid-cols-2 gap-1 bg-black", className)}>
        {/* Artist Video - Left/Primary */}
        <div className="relative flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={artistVideoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
            Artist
          </div>
        </div>
        
        {/* Fan Video - Right */}
        <div className="relative flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={fanVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
            Fan
          </div>
        </div>
      </div>
    );
  }

  // PiP Layout - Artist full, fan in corner
  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {/* Artist Video - Full */}
      <div className="w-full h-full flex items-center justify-center">
        <video
          ref={artistVideoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Fan Video - PiP Overlay */}
      {fanStream && (
        <div 
          className={cn(
            "absolute w-1/4 min-w-[120px] max-w-[200px] aspect-video",
            "rounded-lg overflow-hidden border-2 border-primary/50",
            "shadow-lg shadow-black/50",
            "transition-all duration-200",
            pipPositionClasses[pipPosition]
          )}
        >
          <video
            ref={fanVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
            Fan
          </div>
        </div>
      )}
    </div>
  );
}
