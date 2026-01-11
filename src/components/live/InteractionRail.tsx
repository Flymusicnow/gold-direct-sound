import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InteractionRailProps {
  streamId: string;
  artistId: string;
  isArtist: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * InteractionRail - Container for all interactive elements
 * Contains: Chat, Gifts, Reactions, Stage Requests
 * Never overlaps the Stage zone
 */
export function InteractionRail({
  streamId,
  artistId,
  isArtist,
  children,
  className,
}: InteractionRailProps) {
  return (
    <div 
      className={cn(
        "flex flex-col h-full overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * InteractionRail.Header - Title/controls area at top of rail
 */
interface RailHeaderProps {
  children: ReactNode;
  className?: string;
}

function RailHeader({ children, className }: RailHeaderProps) {
  return (
    <div className={cn(
      "flex-shrink-0 px-4 py-3 border-b border-border/50",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * InteractionRail.Content - Scrollable content area
 */
interface RailContentProps {
  children: ReactNode;
  className?: string;
}

function RailContent({ children, className }: RailContentProps) {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto overflow-x-hidden",
      "scrollbar-auto-hide",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * InteractionRail.Footer - Fixed footer for input/actions
 */
interface RailFooterProps {
  children: ReactNode;
  className?: string;
}

function RailFooter({ children, className }: RailFooterProps) {
  return (
    <div className={cn(
      "flex-shrink-0 border-t border-border/50",
      className
    )}>
      {children}
    </div>
  );
}

// Attach sub-components
InteractionRail.Header = RailHeader;
InteractionRail.Content = RailContent;
InteractionRail.Footer = RailFooter;
