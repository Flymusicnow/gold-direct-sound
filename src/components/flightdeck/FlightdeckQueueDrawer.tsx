import { useState, useEffect } from "react";
import { GripVertical, Music, Heart, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { useLikes } from "@/contexts/LikesContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QueueItemProps {
  item: FlightdeckItem;
  isCurrent: boolean;
  isLiked: boolean;
  onToggleLike: () => void;
  onRemove: () => void;
}

function QueueItem({ item, isCurrent, isLiked, onToggleLike, onRemove }: QueueItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.queueId || item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all bg-card",
        isCurrent && "bg-primary/10 border border-primary/50",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle - More visible */}
      <button 
        {...attributes}
        {...listeners} 
        className="cursor-grab active:cursor-grabbing touch-none p-2 -m-2 rounded hover:bg-muted/50"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt={item.title}
          className="w-12 h-12 rounded object-cover border border-border"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border">
          <Music className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-sm text-muted-foreground truncate">{item.artistName}</p>
        {formatDuration(item.duration) && (
          <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(item.duration)}</p>
        )}
      </div>

      {/* Like button */}
      {item.type === 'track' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className={cn("h-8 w-8", isLiked && "text-red-500")}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </Button>
      )}

      {/* Remove button - separate from drag */}
      {!isCurrent && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {isCurrent && (
        <div className="text-xs font-medium text-primary uppercase tracking-wide shrink-0">
          Playing
        </div>
      )}
    </div>
  );
}

interface FlightdeckQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlightdeckQueueDrawer({ 
  isOpen, 
  onClose,
}: FlightdeckQueueDrawerProps) {
  const { 
    queue, 
    currentItem, 
    reorderQueue, 
    clearQueue,
    removeFromQueue,
  } = useFlightdeck();

  const { isLiked, toggleLike } = useLikes();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item) => (item.queueId || item.id) === active.id);
      const newIndex = queue.findIndex((item) => (item.queueId || item.id) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newQueue = arrayMove(queue, oldIndex, newIndex);
        // Calculate new current index to preserve playback position
        const newCurrentIndex = currentItem 
          ? newQueue.findIndex(item => item.id === currentItem.id)
          : 0;
        reorderQueue(newQueue, newCurrentIndex >= 0 ? newCurrentIndex : 0);
      }
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="lg:hidden">
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[50vh] flex flex-col z-[70]">
          <DrawerHeader className="flex-shrink-0 border-b border-border pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle>Now Playing</DrawerTitle>
              {queue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearQueue}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </DrawerHeader>

          {/* Now Playing - Simple display */}
          {currentItem && (
            <div className="flex-shrink-0 px-4 py-3 bg-primary/5 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Now Playing</p>
              <Link 
                to={`/artist/${currentItem.artistUserId}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {currentItem.coverUrl ? (
                  <img
                    src={currentItem.coverUrl}
                    alt={currentItem.title}
                    className="w-12 h-12 rounded object-cover border border-primary/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{currentItem.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentItem.artistName}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Queue Section - flex-1 to take remaining space */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Queue Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-b border-border bg-muted/30">
              <div>
                <h3 className="font-semibold text-sm">Up Next</h3>
                <p className="text-xs text-muted-foreground">
                  {queue.length} {queue.length === 1 ? "item" : "items"} • Drag to reorder
                </p>
              </div>
            </div>

            {/* Queue List - flex-1 fills remaining space */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2 pb-8">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Music className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm">Queue is empty</p>
                    <p className="text-muted-foreground/70 text-xs mt-1">
                      Add tracks to start building your queue
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={queue.map((item) => item.queueId || item.id)} strategy={verticalListSortingStrategy}>
                      {queue.map((item) => (
                        <QueueItem
                          key={item.queueId || item.id}
                          item={item}
                          isCurrent={currentItem?.id === item.id}
                          isLiked={isLiked(item.id)}
                          onToggleLike={() => toggleLike(item.id, item.artistId)}
                          onRemove={() => removeFromQueue(item.queueId || item.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
