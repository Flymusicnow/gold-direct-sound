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

  // Initial fetch
  useEffect(() => {
    fetchActiveGoal();
  }, [fetchActiveGoal]);

  // Poll every 10 seconds as a fallback for when Realtime is unavailable
  useEffect(() => {
    if (!artistId) return;
    const id = setInterval(fetchActiveGoal, 10_000);
    return () => clearInterval(id);
  }, [artistId, fetchActiveGoal]);

  // Realtime subscription — updates the card instantly when any fan donates
  useEffect(() => {
    if (!artistId) return;

    const channel = supabase
      .channel(`artist_goals:${artistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artist_goals',
          filter: `artist_id=eq.${artistId}`,
        },
        (payload) => {
          const updated = payload.new as ArtistGoal;
          // Only apply if the realtime value is >= our optimistic state
          // to avoid rolling back a just-applied optimistic update
          setGoal(prev => {
            if (!prev) return updated;
            if ((updated.current_amount ?? 0) >= (prev.current_amount ?? 0)) return updated;
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId]);

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

    const { data, error } = await supabase.rpc('donate_to_goal', {
      p_goal_id: goal.id,
      p_amount: amount,
    });

    if (error) {
      console.error('[useActiveGoal] RPC error:', error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, error: result.error || 'Donation failed' };
    }

    // Optimistic update — reflect new totals immediately
    setGoal(prev =>
      prev
        ? {
            ...prev,
            current_amount: prev.current_amount + amount,
            supporter_count: prev.supporter_count + 1,
          }
        : prev
    );

    // Background sync — authoritative value overwrites the optimistic state
    fetchActiveGoal();

    return { success: true };
  };

  return {
    goal,
    loading,
    donate,
    refetch: fetchActiveGoal,
  };
}
