import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSupportScore } from './useSupportScore';
import { trackEventDirect } from './useEventTracker';

export function useFollowArtist(artistId: string, initialFollowing: boolean = false) {
  const { user } = useAuth();
  const { updateSupportScore } = useSupportScore();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const toggleFollow = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('fan_id', user.id)
          .eq('artist_id', artistId);
        setIsFollowing(false);
        toast.success('Unfollowed artist');
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ fan_id: user.id, artist_id: artistId });
        setIsFollowing(true);
        
        // Track follow event
        try { trackEventDirect('follow', { metadata: { artist_id: artistId } }); } catch {
          // Following should not fail if event tracking is unavailable.
        }
        
        // Update supporter XP and check fan achievements
        await updateSupportScore(artistId, 'follow');
        
        // Track onboarding progress
        await supabase
          .from('fan_onboarding_progress')
          .upsert({
            user_id: user.id,
            has_followed_artist: true,
          });
        
        toast.success('Following artist');
      }
    } catch (error) {
      console.error('Error updating follow:', error);
      toast.error('Failed to update follow');
    } finally {
      setIsUpdating(false);
    }
  };

  const closeLoginPrompt = () => setShowLoginPrompt(false);

  return { isFollowing, isUpdating, toggleFollow, showLoginPrompt, closeLoginPrompt };
}
