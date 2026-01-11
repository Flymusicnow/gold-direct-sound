import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SafeVideoStageProps {
  children: ReactNode;
  layout?: 'solo' | 'split' | 'pip';
  pipPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * SafeVideoStage - Video container guaranteeing safe framing
 * Per SUPER CARD: Video content is sacred. No cut-off ever.
 * 
 * Features:
 * - object-fit: contain (never crop)
 * - Letterboxing for wide content
 * - Pillarboxing for portrait content
 * - PiP overlay slots for fan-on-stage
 */
export function SafeVideoStage({ 
  children, 
  layout = 'solo',
  pipPosition = 'bottom-right',
  className 
}: SafeVideoStageProps) {
  const pipPositionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full",
        // Letterbox/pillarbox container
        "flex items-center justify-center",
        // Safe zone background
        "bg-black",
        className
      )}
    >
      {layout === 'solo' && (
        <div className="video-aspect-preserve w-full h-full flex items-center justify-center">
          {children}
        </div>
      )}
      
      {layout === 'split' && (
        <div className="w-full h-full grid grid-cols-2 gap-1">
          {children}
        </div>
      )}
      
      {layout === 'pip' && (
        <>
          {/* Main video (first child) */}
          <div className="video-aspect-preserve w-full h-full flex items-center justify-center">
            {Array.isArray(children) ? children[0] : children}
          </div>
          
          {/* PiP overlay (second child) - approved corner positions only */}
          {Array.isArray(children) && children[1] && (
            <div 
              className={cn(
                "absolute w-1/4 min-w-[120px] max-w-[200px] aspect-video",
                "rounded-lg overflow-hidden border-2 border-primary/50",
                "shadow-lg shadow-black/50",
                pipPositionClasses[pipPosition]
              )}
            >
              {children[1]}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * VideoElement - Wrapper for video elements ensuring contain behavior
 */
interface VideoElementProps {
  src?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  className?: string;
  children?: ReactNode;
}

export function VideoElement({ 
  src, 
  videoRef,
  autoPlay = true, 
  muted = false, 
  playsInline = true,
  className,
  children
}: VideoElementProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {src ? (
        <video
          ref={videoRef}
          src={src}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          className={cn(
            "max-w-full max-h-full",
            "object-contain", // NEVER crop - per SUPER CARD
            className
          )}
        />
      ) : (
        children
      )}
    </div>
  );
}
