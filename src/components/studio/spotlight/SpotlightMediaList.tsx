import { useState } from "react";
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
import { SpotlightMedia } from "@/hooks/useArtistSpotlight";
import { SpotlightMediaCard } from "./SpotlightMediaCard";

interface SpotlightMediaListProps {
  items: SpotlightMedia[];
  onDelete: (id: string, url: string) => void;
  onReorder: (items: { id: string; display_order: number }[]) => void;
  onUpdate: (id: string, updates: Partial<SpotlightMedia>) => void;
}

function SortableItem({ 
  item, 
  onDelete, 
  onUpdate 
}: { 
  item: SpotlightMedia; 
  onDelete: (id: string, url: string) => void;
  onUpdate: (id: string, updates: Partial<SpotlightMedia>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SpotlightMediaCard
        item={item}
        onDelete={onDelete}
        onUpdate={onUpdate}
        isDragging={isDragging}
      />
    </div>
  );
}

export function SpotlightMediaList({ 
  items, 
  onDelete, 
  onReorder,
  onUpdate 
}: SpotlightMediaListProps) {
  const [localItems, setLocalItems] = useState(items);

  // Update local items when props change
  if (items !== localItems && JSON.stringify(items.map(i => i.id)) !== JSON.stringify(localItems.map(i => i.id))) {
    setLocalItems(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // Update display_order for all items
      const reorderUpdates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index + 1,
      }));
      onReorder(reorderUpdates);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {localItems.map((item) => (
            <SortableItem 
              key={item.id} 
              item={item} 
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
