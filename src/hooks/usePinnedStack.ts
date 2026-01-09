import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PinnedStack {
  id: string;
  name: string;
}

export function usePinnedStack() {
  const { user } = useAuth();
  const [pinnedStack, setPinnedStack] = useState<PinnedStack | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPinnedStack = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_pinned', true)
        .maybeSingle();

      if (error) throw error;
      setPinnedStack(data);
    } catch (error) {
      console.error('Error fetching pinned stack:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPinnedStack();
  }, [fetchPinnedStack]);

  const pinStack = async (playlistId: string, playlistName: string) => {
    if (!user) return;

    try {
      // Unpin all stacks first
      await supabase
        .from('playlists')
        .update({ is_pinned: false })
        .eq('user_id', user.id);

      // Pin the selected stack
      const { error } = await supabase
        .from('playlists')
        .update({ is_pinned: true })
        .eq('id', playlistId);

      if (error) throw error;

      setPinnedStack({ id: playlistId, name: playlistName });
      toast.success(`"${playlistName}" pinned for Quick Add`);
    } catch (error) {
      console.error('Error pinning stack:', error);
      toast.error('Failed to pin stack');
    }
  };

  const unpinStack = async () => {
    if (!user || !pinnedStack) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .update({ is_pinned: false })
        .eq('id', pinnedStack.id);

      if (error) throw error;

      setPinnedStack(null);
      toast.success('Stack unpinned');
    } catch (error) {
      console.error('Error unpinning stack:', error);
      toast.error('Failed to unpin stack');
    }
  };

  const addToQuickStack = async (trackId: string, trackTitle: string) => {
    if (!user || !pinnedStack) {
      toast.error('No pinned stack. Pin a stack first!');
      return false;
    }

    try {
      // Check if track already in stack
      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', pinnedStack.id)
        .eq('track_id', trackId)
        .maybeSingle();

      if (existing) {
        toast.info(`Already in "${pinnedStack.name}"`);
        return true;
      }

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: pinnedStack.id,
          track_id: trackId,
          position: 0,
        });

      if (error) throw error;

      toast.success(`Added to "${pinnedStack.name}"`);
      return true;
    } catch (error) {
      console.error('Error adding to quick stack:', error);
      toast.error('Failed to add to stack');
      return false;
    }
  };

  return {
    pinnedStack,
    loading,
    pinStack,
    unpinStack,
    addToQuickStack,
    refetch: fetchPinnedStack,
  };
}
