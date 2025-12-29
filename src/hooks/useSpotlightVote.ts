import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFlightRecorder } from '@/contexts/FlightRecorderContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useSupportScore } from './useSupportScore';
import { useFanAchievementChecker } from './useFanAchievementChecker';

export function useSpotlightVote(entryId: string, campaignId: string, artistId: string, initialVoted: boolean = false) {
  const { user } = useAuth();
  const { startFlow, step, endFlow } = useFlightRecorder();
  const { updateSupportScore } = useSupportScore();
  const { checkAndUnlockAchievements } = useFanAchievementChecker();
  const [hasVoted, setHasVoted] = useState(initialVoted);
  const [isVoting, setIsVoting] = useState(false);

  const toggleVote = async () => {
    startFlow('vote_song');
    
    // Check auth
    step('check_auth', user ? 'ok' : 'fail', { hasUser: !!user });
    if (!user) {
      toast.error('Please sign in to vote');
      endFlow('fail');
      return;
    }

    if (isVoting) {
      step('check_voting_state', 'skip', { reason: 'already_voting' });
      endFlow('skip');
      return;
    }
    
    setIsVoting(true);

    try {
      if (hasVoted) {
        // Remove vote
        step('remove_vote', 'start');
        const { error } = await supabase
          .from('spotlight_votes')
          .delete()
          .eq('fan_user_id', user.id)
          .eq('entry_id', entryId);
        
        if (error) throw error;
        
        step('remove_vote', 'ok');
        setHasVoted(false);
        toast.success('Vote removed');
        endFlow('ok');
      } else {
        // Cast vote
        step('submit_vote', 'start');
        const { error } = await supabase
          .from('spotlight_votes')
          .insert({
            fan_user_id: user.id,
            entry_id: entryId,
            campaign_id: campaignId,
          });
        
        if (error) throw error;
        
        step('submit_vote', 'ok');
        setHasVoted(true);
        
        // Update support score
        step('update_support_score', 'start');
        try {
          updateSupportScore(artistId, 'spotlight_vote');
          step('update_support_score', 'ok');
        } catch (scoreError) {
          step('update_support_score', 'warn', { error: (scoreError as Error).message });
        }
        
        // Check for new achievements
        step('check_achievements', 'start');
        try {
          await checkAndUnlockAchievements();
          step('check_achievements', 'ok');
        } catch (achievementError) {
          step('check_achievements', 'warn', { error: (achievementError as Error).message });
        }
        
        // Track onboarding progress
        step('track_onboarding', 'start');
        const { error: onboardingError } = await supabase
          .from('fan_onboarding_progress')
          .upsert({
            user_id: user.id,
            has_voted_spotlight: true,
          });
        
        if (onboardingError) {
          step('track_onboarding', 'warn', { error: onboardingError.message });
        } else {
          step('track_onboarding', 'ok');
        }
        
        // Trigger gold star confetti animation
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#E8BF1A', '#F4D67A', '#C89F0A'],
          shapes: ['star'],
          scalar: 1.2,
        });
        
        toast.success('⭐ Vote cast!');
        endFlow('ok');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Unknown error';
      step('vote_error', 'fail', { error: errorMessage });
      console.error('Error voting:', error);
      toast.error('Failed to vote');
      endFlow('fail');
    } finally {
      setIsVoting(false);
    }
  };

  return { hasVoted, isVoting, toggleVote };
}
