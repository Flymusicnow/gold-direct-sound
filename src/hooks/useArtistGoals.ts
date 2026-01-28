import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ArtistGoal {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  supporter_count: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  target_amount: number;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  target_amount?: number;
}

interface UseArtistGoalsResult {
  goals: ArtistGoal[];
  activeGoal: ArtistGoal | null;
  loading: boolean;
  createGoal: (data: CreateGoalInput) => Promise<{ success: boolean; error?: string }>;
  updateGoal: (id: string, data: UpdateGoalInput) => Promise<{ success: boolean; error?: string }>;
  activateGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  pauseGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  completeGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useArtistGoals(): UseArtistGoalsResult {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ArtistGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);

  // Get the artist profile ID for the current user
  useEffect(() => {
    const fetchArtistId = async () => {
      if (!user) {
        setArtistId(null);
        return;
      }

      const { data } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setArtistId(data?.id || null);
    };

    fetchArtistId();
  }, [user]);

  const fetchGoals = useCallback(async () => {
    if (!artistId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('artist_goals')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useArtistGoals] Error fetching goals:', error);
      toast.error('Failed to load goals');
    } else {
      setGoals((data as ArtistGoal[]) || []);
    }
    setLoading(false);
  }, [artistId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const activeGoal = goals.find(g => g.status === 'active') || null;

  const createGoal = async (data: CreateGoalInput) => {
    if (!artistId) return { success: false, error: 'No artist profile found' };

    const { error } = await supabase
      .from('artist_goals')
      .insert({
        artist_id: artistId,
        title: data.title,
        description: data.description || null,
        target_amount: data.target_amount,
        status: 'draft',
      });

    if (error) {
      console.error('[useArtistGoals] Create error:', error);
      return { success: false, error: error.message };
    }

    await fetchGoals();
    return { success: true };
  };

  const updateGoal = async (id: string, data: UpdateGoalInput) => {
    const { error } = await supabase
      .from('artist_goals')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[useArtistGoals] Update error:', error);
      return { success: false, error: error.message };
    }

    await fetchGoals();
    return { success: true };
  };

  const activateGoal = async (id: string) => {
    // Check if there's already an active goal
    if (activeGoal && activeGoal.id !== id) {
      return { success: false, error: 'You already have an active goal. Pause it first.' };
    }

    const { error } = await supabase
      .from('artist_goals')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[useArtistGoals] Activate error:', error);
      return { success: false, error: error.message };
    }

    await fetchGoals();
    return { success: true };
  };

  const pauseGoal = async (id: string) => {
    const { error } = await supabase
      .from('artist_goals')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[useArtistGoals] Pause error:', error);
      return { success: false, error: error.message };
    }

    await fetchGoals();
    return { success: true };
  };

  const completeGoal = async (id: string) => {
    const { error } = await supabase
      .from('artist_goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[useArtistGoals] Complete error:', error);
      return { success: false, error: error.message };
    }

    await fetchGoals();
    return { success: true };
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('artist_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[useArtistGoals] Delete error:', error);
      return { success: false, error: error.message };
    }

    await fetchGoals();
    return { success: true };
  };

  return {
    goals,
    activeGoal,
    loading,
    createGoal,
    updateGoal,
    activateGoal,
    pauseGoal,
    completeGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}
