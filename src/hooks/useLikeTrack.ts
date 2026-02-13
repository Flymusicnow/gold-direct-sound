import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSupportScore } from './useSupportScore';
import { useMissions } from './useMissions';
import { trackEventDirect } from './useEventTracker';

export function useLikeTrack(trackId: string, artistId: string, initialLiked: boolean = false) {
  const { user } = useAuth();
  const { updateSupportScore } = useSupportScore();
  const { updateMissionProgress } = useMissions();
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
        
        // Track save event
        try { trackEventDirect('save', { trackId }); } catch {}
        
        // Update support score
        updateSupportScore(artistId, 'like_track');
        
        // Update mission progress for daily likes
        updateMissionProgress('daily_like_tracks');
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
