import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSpotlightVote(entryId: string, campaignId: string, initialVoted: boolean = false) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(initialVoted);
  const [isVoting, setIsVoting] = useState(false);

  const toggleVote = async () => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      if (hasVoted) {
        // Remove vote
        await supabase
          .from('spotlight_votes')
          .delete()
          .eq('fan_user_id', user.id)
          .eq('entry_id', entryId);
        setHasVoted(false);
        toast.success('Vote removed');
      } else {
        // Cast vote
        await supabase
          .from('spotlight_votes')
          .insert({
            fan_user_id: user.id,
            entry_id: entryId,
            campaign_id: campaignId,
          });
        setHasVoted(true);
        
        // Show gold star animation
        toast.success('⭐ Vote cast!');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  return { hasVoted, isVoting, toggleVote };
}
