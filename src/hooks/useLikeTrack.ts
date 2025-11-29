import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useLikeTrack(trackId: string, initialLiked: boolean = false) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like tracks');
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);
        setLiked(false);
        toast.success('Removed from liked tracks');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: trackId });
        setLiked(true);
        toast.success('Added to liked tracks');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsUpdating(false);
    }
  };

  return { liked, isUpdating, toggleLike };
}
