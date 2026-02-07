import { ReactNode } from 'react';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { FlightdeckQueueSidebar } from './FlightdeckQueueSidebar';
import { FlightdeckPlayer } from './FlightdeckPlayer';
import { VideoMiniPlayer } from '@/components/video/VideoMiniPlayer';
import { VideoSessionModal } from '@/components/video/VideoSessionModal';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FlightdeckLayoutProps {
  children: ReactNode;
}

/**
 * FlightdeckLayout provides a professional app shell:
 * - h-screen overflow-hidden (no body scroll)
 * - Main content scrolls internally
 * - Queue sidebar is FIXED position (independent of scroll)
 * - Player bar is FIXED at bottom
 * - Video mini player floats above player
 * - Video session modal for expanded view
 */
export function FlightdeckLayout({ children }: FlightdeckLayoutProps) {
  const { queueOpen, currentItem } = useFlightdeck();
  const isMobile = useIsMobile();

  // Separate NavigationWrapper from page content
  const childArray = Array.isArray(children) ? children : [children];
  
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Main content area - scrolls internally */}
      <main 
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-auto-hide",
          // Padding at bottom for fixed player (88px)
          currentItem && "pb-[88px]",
          // Desktop: squeeze content when queue opens (400px sidebar)
          !isMobile && queueOpen && "lg:mr-[400px]"
        )}
        style={{ transition: 'margin-right 300ms ease' }}
      >
        {childArray}
      </main>

      {/* Queue Sidebar - FIXED position, not part of layout flow */}
      <FlightdeckQueueSidebar />

      {/* Player Bar - FIXED at very bottom */}
      <FlightdeckPlayer />

      {/* Video Mini Player - floats above player bar */}
      <VideoMiniPlayer />

      {/* Video Session Modal - for expanded video view */}
      <VideoSessionModal />
    </div>
  );
}
