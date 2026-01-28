import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ArtistGoal } from './useArtistGoals';

interface UseActiveGoalResult {
  goal: ArtistGoal | null;
  loading: boolean;
  donate: (amount: number) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useActiveGoal(artistId: string | undefined): UseActiveGoalResult {
  const { user } = useAuth();
  const [goal, setGoal] = useState<ArtistGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveGoal = useCallback(async () => {
    if (!artistId) {
      setGoal(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('artist_goals')
      .select('*')
      .eq('artist_id', artistId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[useActiveGoal] Error fetching goal:', error);
    }
    
    setGoal((data as ArtistGoal) || null);
    setLoading(false);
  }, [artistId]);

  useEffect(() => {
    fetchActiveGoal();
  }, [fetchActiveGoal]);

  const donate = async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Please sign in to donate' };
    }

    if (!goal) {
      return { success: false, error: 'No active goal found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Check if this is the fan's first donation to this goal
    const { data: existingDonation } = await supabase
      .from('goal_donations')
      .select('id')
      .eq('goal_id', goal.id)
      .eq('fan_user_id', user.id)
      .maybeSingle();

    const isFirstDonation = !existingDonation;

    // Insert the donation
    const { error: donationError } = await supabase
      .from('goal_donations')
      .insert({
        goal_id: goal.id,
        fan_user_id: user.id,
        amount: amount,
      });

    if (donationError) {
      console.error('[useActiveGoal] Donation insert error:', donationError);
      return { success: false, error: donationError.message };
    }

    // Update goal amounts
    const updateData: Record<string, unknown> = {
      current_amount: goal.current_amount + amount,
      updated_at: new Date().toISOString(),
    };

    // Increment supporter count only if first donation
    if (isFirstDonation) {
      updateData.supporter_count = goal.supporter_count + 1;
    }

    // Check if goal is now complete
    if (goal.current_amount + amount >= goal.target_amount) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('artist_goals')
      .update(updateData)
      .eq('id', goal.id);

    if (updateError) {
      console.error('[useActiveGoal] Goal update error:', updateError);
      return { success: false, error: updateError.message };
    }

    await fetchActiveGoal();
    return { success: true };
  };

  return {
    goal,
    loading,
    donate,
    refetch: fetchActiveGoal,
  };
}
