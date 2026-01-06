import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number;
  previousRank: number | null;
  totalScore: number;
  commentCount: number;
  reactionGivenCount: number;
  reactionReceivedCount: number;
  replyCount: number;
  trend: 'up' | 'down' | 'same';
  lastActivityAt: string | null;
}

interface UseFanLeaderboardOptions {
  limit?: number;
  timeframe?: 'all' | 'month' | 'week';
}

interface UseFanLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFanLeaderboard(
  communityId: string | null,
  options: UseFanLeaderboardOptions = {}
): UseFanLeaderboardResult {
  const { limit = 10 } = options;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!communityId) {
      setLeaderboard([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch engagement scores ordered by total_score
      const { data: scores, error: scoresError } = await supabase
        .from('fan_engagement_scores')
        .select('*')
        .eq('community_id', communityId)
        .order('total_score', { ascending: false })
        .limit(limit);

      if (scoresError) throw scoresError;

      if (!scores || scores.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }

      // Get user profiles for the leaderboard entries
      const userIds = scores.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Map scores to leaderboard entries
      const entries: LeaderboardEntry[] = scores.map((score, index) => {
        const profile = profileMap.get(score.user_id);
        const rank = index + 1;
        const previousRank = score.previous_rank;
        
        let trend: 'up' | 'down' | 'same' = 'same';
        if (previousRank !== null && previousRank !== undefined) {
          if (rank < previousRank) trend = 'up';
          else if (rank > previousRank) trend = 'down';
        }

        return {
          userId: score.user_id,
          displayName: profile?.full_name || 'Anonymous',
          avatarUrl: profile?.avatar_url || null,
          rank,
          previousRank,
          totalScore: score.total_score || 0,
          commentCount: score.comment_count || 0,
          reactionGivenCount: score.reaction_given_count || 0,
          reactionReceivedCount: score.reaction_received_count || 0,
          replyCount: score.reply_count || 0,
          trend,
          lastActivityAt: score.last_activity_at,
        };
      });

      setLeaderboard(entries);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard'));
    } finally {
      setIsLoading(false);
    }
  }, [communityId, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!communityId) return;

    const channel = supabase
      .channel(`leaderboard:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fan_engagement_scores',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, fetchLeaderboard]);

  return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}
