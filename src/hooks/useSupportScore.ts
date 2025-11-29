import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Action weights for supporter score calculation
const ACTION_WEIGHTS = {
  like_track: 1,
  play_track: 0.5,
  add_to_stack: 2,
  spotlight_vote: 5,
  share: 3,
  comment: 2,
} as const;

// Level thresholds
const LEVEL_THRESHOLDS = {
  bronze: 10,
  silver: 50,
  gold: 150,
} as const;

type SupportAction = keyof typeof ACTION_WEIGHTS;

// Calculate level based on score
function calculateLevel(score: number): 'none' | 'bronze' | 'silver' | 'gold' {
  if (score >= LEVEL_THRESHOLDS.gold) return 'gold';
  if (score >= LEVEL_THRESHOLDS.silver) return 'silver';
  if (score >= LEVEL_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

export function useSupportScore() {
  const { user } = useAuth();

  const updateSupportScore = async (artistId: string, action: SupportAction) => {
    if (!user) return;

    const points = ACTION_WEIGHTS[action];

    try {
      // Fire-and-forget async update (non-blocking)
      // Fetch current score
      const { data: existing } = await supabase
        .from('fan_support_scores')
        .select('score')
        .eq('fan_user_id', user.id)
        .eq('artist_id', artistId)
        .single();

      const currentScore = existing?.score || 0;
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
    } catch (error) {
      // Silent error logging - don't block UI
      console.error('Error updating support score:', error);
    }
  };

  return { updateSupportScore };
}
