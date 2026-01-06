import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserEngagement {
  rank: number | null;
  totalScore: number;
  percentile: number;
  breakdown: {
    comments: number;
    reactions: number;
    replies: number;
  };
  lastActivityAt: string | null;
}

const DEFAULT_ENGAGEMENT: UserEngagement = {
  rank: null,
  totalScore: 0,
  percentile: 0,
  breakdown: {
    comments: 0,
    reactions: 0,
    replies: 0,
  },
  lastActivityAt: null,
};

export function useUserEngagementScore(
  communityId: string | null,
  userId?: string
): {
  engagement: UserEngagement;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [engagement, setEngagement] = useState<UserEngagement>(DEFAULT_ENGAGEMENT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEngagement = useCallback(async () => {
    if (!communityId || !targetUserId) {
      setEngagement(DEFAULT_ENGAGEMENT);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user's score
      const { data: userScore, error: scoreError } = await supabase
        .from('fan_engagement_scores')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (scoreError) throw scoreError;

      if (!userScore) {
        setEngagement(DEFAULT_ENGAGEMENT);
        setIsLoading(false);
        return;
      }

      // Calculate rank by counting users with higher scores
      const { count: higherCount, error: countError } = await supabase
        .from('fan_engagement_scores')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .gt('total_score', userScore.total_score || 0);

      if (countError) throw countError;

      const rank = (higherCount || 0) + 1;

      // Get total member count for percentile
      const { count: totalCount, error: totalError } = await supabase
        .from('fan_engagement_scores')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

      if (totalError) throw totalError;

      const percentile = totalCount ? Math.round(((totalCount - rank + 1) / totalCount) * 100) : 0;

      setEngagement({
        rank,
        totalScore: userScore.total_score || 0,
        percentile,
        breakdown: {
          comments: userScore.comment_count || 0,
          reactions: (userScore.reaction_given_count || 0) + (userScore.reaction_received_count || 0),
          replies: userScore.reply_count || 0,
        },
        lastActivityAt: userScore.last_activity_at,
      });
    } catch (err) {
      console.error('Error fetching user engagement:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch engagement'));
    } finally {
      setIsLoading(false);
    }
  }, [communityId, targetUserId]);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  return { engagement, isLoading, error, refetch: fetchEngagement };
}
