import { GripVertical, Music } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { cn } from "@/lib/utils";
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

interface QueueItemProps {
  item: FlightdeckItem;
  isCurrent: boolean;
}

function QueueItem({ item, isCurrent }: QueueItemProps) {
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
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        isCurrent 
          ? "bg-primary/10 border border-primary/50" 
          : "bg-card"
      )}
    >
      <button 
        {...attributes}
        {...listeners} 
        className="cursor-grab active:cursor-grabbing touch-none"
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

export function FlightdeckQueueDrawer({ isOpen, onClose }: FlightdeckQueueDrawerProps) {
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

  return (
    <div className="lg:hidden">
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Queue</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
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
        </DrawerHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="p-4 space-y-2">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
      </DrawerContent>
    </Drawer>
    </div>
  );
}
