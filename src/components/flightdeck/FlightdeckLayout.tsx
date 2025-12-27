import { ReactNode } from 'react';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { FlightdeckQueueSidebar } from './FlightdeckQueueSidebar';
import { FlightdeckPlayer } from './FlightdeckPlayer';
import { cn } from '@/lib/utils';

interface FlightdeckLayoutProps {
  children: ReactNode;
}

/**
 * FlightdeckLayout provides a Spotify-style layout:
 * - Main content compresses when queue sidebar opens
 * - Player bar stays fixed at bottom
 * - Queue sidebar pushes content (not overlay)
 */
export function FlightdeckLayout({ children }: FlightdeckLayoutProps) {
  const { queueOpen, currentItem } = useFlightdeck();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main layout with sidebar */}
      <div className="flex flex-1 w-full">
        {/* Main content area - shrinks when queue opens */}
        <div 
          className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            // Add padding at bottom for player when it's visible
            currentItem && "pb-28 lg:pb-24"
          )}
        >
          {children}
        </div>

        {/* Desktop Queue Sidebar - part of layout flow, not overlay */}
        <FlightdeckQueueSidebar />
      </div>

      {/* Player bar - fixed at very bottom */}
      <FlightdeckPlayer />
    </div>
  );
}
