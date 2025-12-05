import { GripVertical, Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
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
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
}

export function FlightdeckQueueDrawer({ 
  isOpen, 
  onClose,
  currentTime,
  duration,
  volume,
  isMuted,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: FlightdeckQueueDrawerProps) {
  const { 
    queue, 
    currentItem, 
    currentIndex,
    isPlaying,
    setQueue, 
    clearQueue,
    togglePlay,
    playNext,
    playPrev,
  } = useFlightdeck();

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

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="lg:hidden">
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] z-[70]">
          <DrawerHeader className="border-b border-border pb-2">
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

          {/* Now Playing Section */}
          {currentItem && (
            <div className="px-6 py-4 bg-gradient-to-b from-primary/5 to-transparent">
              {/* Album Art */}
              <Link to={`/artist/${currentItem.artistUserId}`} className="block mb-4">
                {currentItem.coverUrl ? (
                  <img
                    src={currentItem.coverUrl}
                    alt={currentItem.title}
                    className="w-32 h-32 mx-auto rounded-lg object-cover shadow-lg border border-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-lg bg-muted flex items-center justify-center border border-border">
                    <Music className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </Link>

              {/* Track Info */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg truncate">{currentItem.title}</h3>
                <Link 
                  to={`/artist/${currentItem.artistUserId}`}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {currentItem.artistName}
                </Link>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={onSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playPrev}
                  disabled={currentIndex === 0}
                  className="h-12 w-12"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>
                <Button
                  onClick={togglePlay}
                  size="icon"
                  className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  disabled={currentIndex === queue.length - 1}
                  className="h-12 w-12"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="icon" onClick={onToggleMute} className="h-10 w-10">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={onVolumeChange}
                  className="w-40"
                />
              </div>
            </div>
          )}

          {/* Queue Header */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-b border-border bg-muted/30">
            <div>
              <h3 className="font-semibold text-sm">Up Next</h3>
              <p className="text-xs text-muted-foreground">
                {queue.length} {queue.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          {/* Queue List */}
          <ScrollArea className="max-h-[30vh]">
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
