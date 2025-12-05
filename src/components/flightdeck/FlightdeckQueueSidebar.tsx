import { X, GripVertical, Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
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
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
}

export function FlightdeckQueueSidebar({ 
  isOpen, 
  onClose,
  currentTime,
  duration,
  volume,
  isMuted,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: FlightdeckQueueSidebarProps) {
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

  if (!isOpen) return null;

  return (
    <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-2xl z-[70] flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Now Playing</h2>
            <InfoTooltip
              title="Queue vs Play Now"
              description="'Add to Queue' adds tracks to your playback list without interrupting current track. 'Play Now' starts playing immediately."
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Now Playing Section */}
      {currentItem && (
        <div className="p-6 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          {/* Album Art */}
          <Link to={`/artist/${currentItem.artistUserId}`} className="block mb-4">
            {currentItem.coverUrl ? (
              <img
                src={currentItem.coverUrl}
                alt={currentItem.title}
                className="w-40 h-40 mx-auto rounded-lg object-cover shadow-lg border border-primary/20 hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-40 h-40 mx-auto rounded-lg bg-muted flex items-center justify-center border border-border">
                <Music className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </Link>

          {/* Track Info */}
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg truncate">{currentItem.title}</h3>
            <Link 
              to={`/artist/${currentItem.artistUserId}`}
              className="text-muted-foreground hover:text-primary transition-colors"
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={playPrev}
              disabled={currentIndex === 0}
              className="h-10 w-10"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              onClick={togglePlay}
              size="icon"
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={playNext}
              disabled={currentIndex === queue.length - 1}
              className="h-10 w-10"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" onClick={onToggleMute} className="h-8 w-8">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={onVolumeChange}
              className="w-32"
            />
          </div>
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
