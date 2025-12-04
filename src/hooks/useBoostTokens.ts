import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BoostTokens {
  tokens_available: number;
  tokens_used_this_week: number;
  week_start: string;
}

export function useBoostTokens() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<BoostTokens | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('boost_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Initialize tokens for new user
        const { data: newData, error: insertError } = await supabase
          .from('boost_tokens')
          .insert({
            user_id: user.id,
            tokens_available: 3,
            tokens_used_this_week: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setTokens(newData);
      } else {
        // Check if week has rolled over
        const currentWeekStart = getWeekStart();
        if (data.week_start !== currentWeekStart) {
          const { data: updated, error: updateError } = await supabase
            .from('boost_tokens')
            .update({
              tokens_available: 3,
              tokens_used_this_week: 0,
              week_start: currentWeekStart,
              last_reset_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) throw updateError;
          setTokens(updated);
        } else {
          setTokens(data);
        }
      }
    } catch (error) {
      console.error('Error fetching boost tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const useBoost = useCallback(async (artistId: string, boostType: 'discover' | 'trending' | 'spotlight' | 'feed') => {
    if (!user || !tokens || tokens.tokens_available <= 0) {
      toast.error('No boost tokens available');
      return false;
    }

    try {
      // Record boost usage
      const { error: usageError } = await supabase
        .from('boost_usage')
        .insert({
          user_id: user.id,
          artist_id: artistId,
          boost_type: boostType,
        });

      if (usageError) throw usageError;

      // Update token count
      const { data: updated, error: updateError } = await supabase
        .from('boost_tokens')
        .update({
          tokens_available: tokens.tokens_available - 1,
          tokens_used_this_week: tokens.tokens_used_this_week + 1,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTokens(updated);
      toast.success('Boost applied!');
      return true;
    } catch (error) {
      console.error('Error using boost:', error);
      toast.error('Failed to use boost');
      return false;
    }
  }, [user, tokens]);

  return {
    tokens,
    tokensAvailable: tokens?.tokens_available ?? 0,
    loading,
    useBoost,
    refetch: fetchTokens,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}
