import { useState, useRef, useEffect } from "react";
import { GripVertical, Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, Shuffle, Repeat, Repeat1, X } from "lucide-react";
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
    shuffleEnabled,
    repeatMode,
    setQueue, 
    clearQueue,
    togglePlay,
    playNext,
    playPrev,
    toggleShuffle,
    cycleRepeat,
    removeFromQueue,
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
        <DrawerContent className="h-[85vh] flex flex-col z-[70]">
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

          {/* Now Playing Section - flex-shrink-0 to prevent compression */}
          {currentItem && (
            <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="flex items-center gap-4 mb-3">
                {/* Smaller Album Art */}
                <Link to={`/artist/${currentItem.artistUserId}`} className="flex-shrink-0">
                  {currentItem.coverUrl ? (
                    <img
                      src={currentItem.coverUrl}
                      alt={currentItem.title}
                      className="w-24 h-24 rounded-lg object-cover shadow-lg border border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <Music className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                {/* Track Info with Like */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{currentItem.title}</h3>
                  <Link 
                    to={`/artist/${currentItem.artistUserId}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm truncate block"
                  >
                    {currentItem.artistName}
                  </Link>
                </div>

                {/* Like button for current item */}
                {currentItem.type === 'track' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleLike(currentItem.id, currentItem.artistId)}
                    className={cn("h-10 w-10", likedTracks[currentItem.id] && "text-red-500")}
                  >
                    <Heart className={cn("h-5 w-5", likedTracks[currentItem.id] && "fill-current")} />
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
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

              {/* Playback Controls with Shuffle & Repeat */}
              <div className="flex items-center justify-center gap-2">
                {/* Shuffle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleShuffle}
                  className={cn("h-10 w-10", shuffleEnabled && "text-primary")}
                >
                  <Shuffle className="h-5 w-5" />
                </Button>

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
                  {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  disabled={currentIndex === queue.length - 1 && repeatMode === 'off'}
                  className="h-10 w-10"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>

                {/* Repeat */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleRepeat}
                  className={cn("h-10 w-10", repeatMode !== 'off' && "text-primary")}
                >
                  {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                </Button>
              </div>

              {/* Volume inline */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button variant="ghost" size="icon" onClick={onToggleMute} className="h-10 w-10">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={onVolumeChange}
                  className="w-24"
                />
              </div>
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
                    <SortableContext items={queue.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                      {queue.map((item) => (
                        <QueueItem
                          key={item.id}
                          item={item}
                          isCurrent={currentItem?.id === item.id}
                          isLiked={likedTracks[item.id] || false}
                          onToggleLike={() => handleToggleLike(item.id, item.artistId)}
                          onRemove={() => removeFromQueue(item.id)}
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
