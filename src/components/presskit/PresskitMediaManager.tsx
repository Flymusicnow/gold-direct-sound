import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, Music, FileImage, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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

interface PresskitMediaManagerProps {
  presskitId: string;
}

interface MediaItem {
  id: string;
  type: string;
  url: string;
  description: string | null;
  sort_order: number;
}

function SortableMediaItem({ media, onDelete }: { media: MediaItem; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = () => {
    switch (media.type) {
      case 'photo': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'logo': return <FileImage className="h-5 w-5" />;
      default: return <Image className="h-5 w-5" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{media.description || media.type}</p>
        <p className="text-xs text-muted-foreground truncate">{media.url}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.open(media.url, '_blank')}
        className="flex-shrink-0"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="flex-shrink-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PresskitMediaManager({ presskitId }: PresskitMediaManagerProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedia, setNewMedia] = useState({
    type: 'photo',
    url: '',
    description: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch media
  const { data: media = [] } = useQuery({
    queryKey: ['presskit-media', presskitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_presskit_media')
        .select('*')
        .eq('presskit_id', presskitId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  // Add media mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newMedia.url) throw new Error('URL is required');
      
      const { error } = await supabase
        .from('artist_presskit_media')
        .insert({
          presskit_id: presskitId,
          type: newMedia.type,
          url: newMedia.url,
          description: newMedia.description || null,
          sort_order: media.length,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presskit-media', presskitId] });
      setNewMedia({ type: 'photo', url: '', description: '' });
      setShowAddForm(false);
      toast.success('Media added');
    },
    onError: () => {
      toast.error('Failed to add media');
    },
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('artist_presskit_media')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presskit-media', presskitId] });
      toast.success('Media removed');
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (items: MediaItem[]) => {
      const updates = items.map((item, index) => ({
        id: item.id,
        presskit_id: presskitId,
        type: item.type,
        url: item.url,
        description: item.description,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('artist_presskit_media')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presskit-media', presskitId] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex((item) => item.id === active.id);
      const newIndex = media.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(media, oldIndex, newIndex);
      reorderMutation.mutate(newOrder);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Media</CardTitle>
            <CardDescription>Press photos, videos, and logos</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Media
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/20">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newMedia.type}
                  onValueChange={(value) => setNewMedia(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>URL *</Label>
                <Input
                  value={newMedia.url}
                  onChange={(e) => setNewMedia(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newMedia.description}
                onChange={(e) => setNewMedia(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Press photo 2024, Official logo"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !newMedia.url}>
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        )}

        {/* Media List */}
        {media.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={media.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {media.map((item) => (
                  <SortableMediaItem
                    key={item.id}
                    media={item}
                    onDelete={() => deleteMutation.mutate(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No media added yet</p>
            <p className="text-xs">Add press photos, videos, or logos to your press kit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
