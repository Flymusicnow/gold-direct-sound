import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useFanTaste } from '@/contexts/FanTasteContext';
import { useFanAchievementChecker } from './useFanAchievementChecker';

// =====================================================
// Taste Engine V1.5: Supporter Score + Taste Weights
// =====================================================
// Supporter score (XP) and Taste profile use different weights
// XP rewards immediate engagement, Taste tracks long-term preferences

// Action weights for supporter score calculation (XP)
const ACTION_WEIGHTS = {
  like_track: 1,
  play_track: 0.5,
  add_to_stack: 2,
  spotlight_vote: 5,
  share: 3,
  comment: 2,
  follow: 3,
  watch_video: 0.5, // new
} as const;

// Level thresholds
const LEVEL_THRESHOLDS = {
  bronze: 10,
  silver: 50,
  gold: 150,
} as const;

type SupportAction = keyof typeof ACTION_WEIGHTS;

// Map support actions to taste profile interactions (Taste Engine V1.5)
// These use the normalized weights defined in update_taste_profile RPC
const TASTE_INTERACTION_MAP: Record<SupportAction, string> = {
  like_track: 'like',           // Taste: +5
  play_track: 'play',           // Taste: +2
  add_to_stack: 'stack_add',    // Taste: +10
  spotlight_vote: 'spotlight_vote', // Taste: +12
  share: 'share',               // Taste: +10
  comment: 'comment',           // Taste: +4
  follow: 'follow',             // Taste: +8
  watch_video: 'watch_video',   // Taste: +3 (new)
};

// Calculate level based on score
function calculateLevel(score: number): 'none' | 'bronze' | 'silver' | 'gold' {
  if (score >= LEVEL_THRESHOLDS.gold) return 'gold';
  if (score >= LEVEL_THRESHOLDS.silver) return 'silver';
  if (score >= LEVEL_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

export function useSupportScore() {
  const { user } = useAuth();
  const { updateTasteFromAction } = useFanTaste();
  const { checkAndUnlockAchievements } = useFanAchievementChecker();

  const updateSupportScore = async (
    artistId: string, 
    action: SupportAction,
    trackId?: string,
    videoId?: string
  ) => {
    if (!user) return;

    const points = ACTION_WEIGHTS[action];

    try {
      // Fire-and-forget async update (non-blocking)
      // Fetch current score
      const { data: existing } = await supabase
        .from('fan_support_scores')
        .select('score, level')
        .eq('fan_user_id', user.id)
        .eq('artist_id', artistId)
        .single();

      const currentScore = existing?.score || 0;
      const previousLevel = existing?.level || 'none';
      const newScore = Number(currentScore) + points;
      const newLevel = calculateLevel(newScore);

      // Upsert score
      await supabase
        .from('fan_support_scores')
        .upsert({
          fan_user_id: user.id,
          artist_id: artistId,
          score: newScore,
          level: newLevel,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'fan_user_id,artist_id',
        });

      // Detect level-up and celebrate
      if (previousLevel !== newLevel && newLevel !== 'none') {
        // Trigger confetti with level-specific colors
        const levelColors = {
          bronze: ['#CD7F32', '#B87333', '#A0522D'],
          silver: ['#C0C0C0', '#A8A9AD', '#71797E'],
          gold: ['#E8BF1A', '#F4D67A', '#C89F0A'],
        };

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: levelColors[newLevel as 'bronze' | 'silver' | 'gold'],
        });

        // Show toast notification
        toast.success(`🎉 You're now a ${newLevel.toUpperCase()} Supporter!`, {
          description: `You've unlocked ${newLevel} supporter status!`,
        });
      }

      // Update taste profile with this action
      const tasteInteraction = TASTE_INTERACTION_MAP[action];
      if (tasteInteraction && updateTasteFromAction) {
        await updateTasteFromAction(artistId, tasteInteraction, trackId, videoId);
      }

      // Check and unlock achievements
      await checkAndUnlockAchievements();
    } catch (error) {
      // Silent error logging - don't block UI
      console.error('Error updating support score:', error);
    }
  };

  return { updateSupportScore };
}
