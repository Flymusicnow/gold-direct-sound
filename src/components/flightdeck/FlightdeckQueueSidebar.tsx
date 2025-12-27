import { useState, useEffect } from "react";
import { X, GripVertical, Music, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
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
        "flex items-center gap-3 p-3 rounded-lg transition-all group relative",
        isCurrent 
          ? "bg-primary/10 border border-primary/50 shadow-sm" 
          : "hover:bg-accent/50"
      )}
    >
      <button 
        {...attributes}
        {...listeners} 
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
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
        <p className="font-medium truncate text-sm">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.artistName}</p>
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
          className={cn("h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity", isLiked && "opacity-100 text-red-500")}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </Button>
      )}

      {/* Remove button - only show for non-current items */}
      {!isCurrent && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {isCurrent && (
        <div className="text-xs font-medium text-primary uppercase tracking-wide">
          Playing
        </div>
      )}
    </div>
  );
}

export function FlightdeckQueueSidebar() {
  const { 
    queue, 
    currentItem, 
    setQueue, 
    clearQueue,
    removeFromQueue,
    queueOpen,
    setQueueOpen,
  } = useFlightdeck();

  const { user } = useAuth();
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});

  // Fetch likes for all tracks in queue
  useEffect(() => {
    if (!user || queue.length === 0) return;
    
    const trackIds = queue.filter(i => i.type === 'track').map(i => i.id);
    if (trackIds.length === 0) return;
    
    supabase
      .from('likes')
      .select('track_id')
      .eq('user_id', user.id)
      .in('track_id', trackIds)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        data?.forEach(like => { map[like.track_id] = true; });
        setLikedTracks(map);
      });
  }, [user, queue]);

  const handleToggleLike = async (trackId: string, artistId: string) => {
    if (!user) {
      toast.error("Please sign in to like tracks");
      return;
    }

    const isCurrentlyLiked = likedTracks[trackId];
    
    if (isCurrentlyLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('track_id', trackId);
      setLikedTracks(prev => ({ ...prev, [trackId]: false }));
      toast.success("Removed from likes");
    } else {
      await supabase.from('likes').insert({ user_id: user.id, track_id: trackId });
      setLikedTracks(prev => ({ ...prev, [trackId]: true }));
      toast.success("Added to likes");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
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
        setQueue(arrayMove(queue, oldIndex, newIndex));
      }
    }
  };

  // Hidden on mobile and when closed
  if (!queueOpen) return null;

  return (
    <div 
      className={cn(
        // FIXED position - independent of scroll
        "hidden lg:flex fixed",
        "top-0 right-0 bottom-[88px]", // Sits above player (88px height)
        "w-[400px]",
        "bg-card border-l border-border",
        "flex-col",
        "z-[50]", // Below player (z-60) but above content
        "transition-transform duration-300",
        queueOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Queue</h2>
            <InfoTooltip
              title="Queue vs Play Now"
              description="'Add to Queue' adds tracks to your playback list without interrupting current track. 'Play Now' starts playing immediately."
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setQueueOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Now Playing - Simple display */}
      {currentItem && (
        <div className="px-4 py-3 border-b border-border bg-primary/5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Now Playing</p>
          <Link 
            to={`/artist/${currentItem.artistUserId}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {currentItem.coverUrl ? (
              <img
                src={currentItem.coverUrl}
                alt={currentItem.title}
                className="w-10 h-10 rounded object-cover border border-primary/20"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center border border-border">
                <Music className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentItem.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentItem.artistName}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Queue Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm">Up Next</h3>
          <p className="text-xs text-muted-foreground">
            {queue.length} {queue.length === 1 ? "item" : "items"}
          </p>
        </div>
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

      {/* Queue List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
                    isLiked={likedTracks[item.id] || false}
                    onToggleLike={() => handleToggleLike(item.id, item.artistId)}
                    onRemove={() => removeFromQueue(item.queueId || item.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
