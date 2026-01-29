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

    // Use the atomic RPC function to handle donation + goal update
    const { data, error } = await supabase.rpc('donate_to_goal', {
      p_goal_id: goal.id,
      p_amount: amount,
    });

    if (error) {
      console.error('[useActiveGoal] RPC error:', error);
      return { success: false, error: error.message };
    }

    // Check the response from the function
    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, error: result.error || 'Donation failed' };
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
