import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

interface GiftOverlayZoneProps {
  streamId: string;
  children?: ReactNode;
  className?: string;
}

/**
 * GiftOverlayZone - Dedicated zone for gift animations
 * Per SUPER CARD: Animations play WITHIN this container, never escape to full screen
 * Lives in the Interaction Rail, not overlapping video
 */
export function GiftOverlayZone({ streamId, children, className }: GiftOverlayZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-24 overflow-hidden",
        "pointer-events-none", // Allow clicks through to elements below
        className
      )}
    >
      {/* Gift animations will be rendered here */}
      {children}
    </div>
  );
}
