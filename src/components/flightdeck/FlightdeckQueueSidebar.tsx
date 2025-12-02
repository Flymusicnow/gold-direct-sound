import { X, GripVertical, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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

interface QueueItemProps {
  item: FlightdeckItem;
  isCurrent: boolean;
  onRemove?: () => void;
}

function QueueItem({ item, isCurrent, onRemove }: QueueItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
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

      {isCurrent && (
        <div className="text-xs font-medium text-primary uppercase tracking-wide">
          Playing
        </div>
      )}
    </div>
  );
}

interface FlightdeckQueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlightdeckQueueSidebar({ isOpen, onClose }: FlightdeckQueueSidebarProps) {
  const { queue, currentItem, setQueue, clearQueue } = useFlightdeck();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item) => item.id === active.id);
      const newIndex = queue.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setQueue(arrayMove(queue, oldIndex, newIndex));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl z-50 flex-col animate-fade-in">
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
          <p className="text-xs text-muted-foreground">
            {queue.length} {queue.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Queue List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
              <SortableContext items={queue.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {queue.map((item) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isCurrent={currentItem?.id === item.id}
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
