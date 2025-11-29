import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CreatePlaylistDialog from '@/components/playlists/CreatePlaylistDialog';

interface Stack {
  id: string;
  name: string;
  description: string | null;
  track_count?: number;
}

interface StackSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

export function StackSelectionModal({ isOpen, onClose, trackId, trackTitle }: StackSelectionModalProps) {
  const { user } = useAuth();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchStacks();
    }
  }, [isOpen, user]);

  const fetchStacks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStacks(data || []);
    } catch (error) {
      console.error('Error fetching stacks:', error);
      toast.error('Failed to load stacks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToStack = async (stackId: string, stackName: string) => {
    if (!user) return;

    try {
      // Check if track already in stack
      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', stackId)
        .eq('track_id', trackId)
        .single();

      if (existing) {
        toast.error('Track already in this stack');
        return;
      }

      // Get current max position
      const { data: maxPos } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', stackId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPos?.position || 0) + 1;

      // Add track to stack
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: stackId,
          track_id: trackId,
          position: newPosition,
        });

      if (error) throw error;

      toast.success(`Added "${trackTitle}" to ${stackName}`);
      onClose();
    } catch (error) {
      console.error('Error adding to stack:', error);
      toast.error('Failed to add to stack');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-primary">Save to Stack</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Stack Button */}
            <Button
              variant="outline"
              className="w-full justify-start border-primary/30 hover:bg-primary/10"
              onClick={() => {
                setCreateOpen(true);
                onClose();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Stack
            </Button>

            {/* Stack List */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading stacks...</div>
            ) : stacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No stacks yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stacks.map((stack) => (
                  <Button
                    key={stack.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-4 hover:bg-card border border-border/50 hover:border-primary/30 transition-all"
                    onClick={() => handleAddToStack(stack.id, stack.name)}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{stack.name}</div>
                      {stack.description && (
                        <div className="text-xs text-muted-foreground truncate">{stack.description}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlaylistDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchStacks()}
      />
    </>
  );
}
