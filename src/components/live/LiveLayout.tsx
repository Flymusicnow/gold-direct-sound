import { ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Orientation } from "@/hooks/useOrientation";

interface LiveLayoutContextValue {
  orientation: Orientation;
}

const LiveLayoutContext = createContext<LiveLayoutContextValue | null>(null);

function useLiveLayoutContext() {
  const context = useContext(LiveLayoutContext);
  if (!context) {
    throw new Error('LiveLayout components must be used within LiveLayout');
  }
  return context;
}

interface LiveLayoutProps {
  children: ReactNode;
  orientation: Orientation;
  className?: string;
}

/**
 * LiveLayout - Zone-based layout system for live streaming
 * Enforces three required zones per SUPER CARD:
 * - Stage (video zone)
 * - Interaction Rail (chat/gifts)
 * - Control Strip (stream controls)
 * 
 * Layout adapts based on orientation:
 * - Portrait: Vertical stack (Controls -> Stage -> Rail)
 * - Landscape: Side-by-side (Stage | Controls + Rail)
 */
export function LiveLayout({ children, orientation, className }: LiveLayoutProps) {
  return (
    <LiveLayoutContext.Provider value={{ orientation }}>
      <div
        className={cn(
          "h-dvh min-h-dvh w-full bg-background overflow-hidden overflow-x-hidden",
          // Grid layout based on orientation
          orientation === 'portrait' 
            ? "grid grid-rows-[auto_1fr_minmax(180px,40vh)]" 
            : "grid grid-cols-[1fr_minmax(320px,420px)] grid-rows-1",
          className
        )}
        style={{
          // CSS custom properties for safe zones
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        } as React.CSSProperties}
      >
        {children}
      </div>
    </LiveLayoutContext.Provider>
  );
}

interface StageProps {
  children: ReactNode;
  className?: string;
}

/**
 * LiveLayout.Stage - Primary video zone
 * Never resized by UI actions
 * Reserved safe zone for video content
 */
function Stage({ children, className }: StageProps) {
  const { orientation } = useLiveLayoutContext();
  
  return (
    <div
      className={cn(
        "relative bg-black overflow-hidden",
        // Order in grid
        orientation === 'portrait' ? "row-start-2" : "col-start-1 row-span-full",
        className
      )}
    >
      {children}
    </div>
  );
}

interface InteractionRailProps {
  children: ReactNode;
  className?: string;
}

/**
 * LiveLayout.InteractionRail - Chat, gifts, reactions zone
 * Scrollable, never overlaps Stage
 */
function InteractionRail({ children, className }: InteractionRailProps) {
  const { orientation } = useLiveLayoutContext();
  
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden overflow-x-hidden bg-card/50",
        // Order and sizing based on orientation
        orientation === 'portrait' 
          ? "row-start-3 border-t border-border/50" 
          : "col-start-2 row-start-1 border-l border-border/50",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ControlStripProps {
  children: ReactNode;
  className?: string;
}

/**
 * LiveLayout.ControlStrip - Stream controls zone
 * Always accessible, never intrusive
 * Never overlaps Stage zone
 */
function ControlStrip({ children, className }: ControlStripProps) {
  const { orientation } = useLiveLayoutContext();
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-border/50",
        // Position based on orientation
        orientation === 'portrait' 
          ? "row-start-1" 
          : "absolute top-0 left-0 right-0 z-10",
        className
      )}
    >
      {children}
    </div>
  );
}

// Attach sub-components to LiveLayout
LiveLayout.Stage = Stage;
LiveLayout.InteractionRail = InteractionRail;
LiveLayout.ControlStrip = ControlStrip;
