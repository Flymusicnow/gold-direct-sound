import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface FlightdeckMiniQueueProps {
  isExpanded: boolean;
  onToggle: () => void;
}

function QueueItem({ item, isCurrent }: { item: FlightdeckItem; isCurrent: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors group",
        isCurrent ? "bg-primary/20 border border-primary/50" : "hover:bg-accent"
      )}
    >
      <button {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {item.coverUrl && (
        <img
          src={item.coverUrl}
          alt={item.title}
          className="w-10 h-10 rounded object-cover"
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.artistName}</p>
      </div>

      {isCurrent && (
        <div className="text-xs text-primary font-medium">Now Playing</div>
      )}
    </div>
  );
}

export function FlightdeckMiniQueue({ isExpanded, onToggle }: FlightdeckMiniQueueProps) {
  const { queue, currentItem, setQueue } = useFlightdeck();

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

  if (!isExpanded) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-background/95 backdrop-blur-lg border border-border rounded-t-lg shadow-lg">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm">
          Up Next ({queue.length} {queue.length === 1 ? "track" : "tracks"})
        </h3>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-64">
        <div className="p-3 space-y-2">
          {queue.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Queue is empty. Add tracks to get started!
            </p>
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