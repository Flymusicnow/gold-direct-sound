import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, startOfMonth, subMonths, format } from 'date-fns';

export interface CommunityAnalytics {
  // Post Engagement
  totalPosts: number;
  postsThisWeek: number;
  postsLastWeek: number;
  postGrowthRate: number;
  
  // Comment Activity
  totalComments: number;
  commentsThisWeek: number;
  commentsLastWeek: number;
  avgCommentsPerPost: number;
  
  // Reactions
  totalReactions: number;
  reactionsThisWeek: number;
  
  // Member Growth
  totalMembers: number;
  newMembersThisWeek: number;
  memberGrowthRate: number;
  membersByTier: { tier: string; count: number }[];
  
  // Top Engagers
  topEngagers: { userId: string; name: string; avatarUrl: string | null; score: number }[];
  
  // Moderation
  hiddenComments: number;
  pinnedPosts: number;
  
  // Time series for charts
  memberGrowthHistory: { date: string; count: number }[];
  postHistory: { date: string; count: number }[];
}

const DEFAULT_ANALYTICS: CommunityAnalytics = {
  totalPosts: 0,
  postsThisWeek: 0,
  postsLastWeek: 0,
  postGrowthRate: 0,
  totalComments: 0,
  commentsThisWeek: 0,
  commentsLastWeek: 0,
  avgCommentsPerPost: 0,
  totalReactions: 0,
  reactionsThisWeek: 0,
  totalMembers: 0,
  newMembersThisWeek: 0,
  memberGrowthRate: 0,
  membersByTier: [],
  topEngagers: [],
  hiddenComments: 0,
  pinnedPosts: 0,
  memberGrowthHistory: [],
  postHistory: [],
};

export function useCommunityAnalytics(communityId: string | null) {
  const [analytics, setAnalytics] = useState<CommunityAnalytics>(DEFAULT_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!communityId) {
      setAnalytics(DEFAULT_ANALYTICS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const now = new Date();
      const weekStart = startOfWeek(now);
      const lastWeekStart = subWeeks(weekStart, 1);
      const monthStart = startOfMonth(now);

      // Get community to find artist_id
      const { data: community } = await supabase
        .from('communities')
        .select('artist_id')
        .eq('id', communityId)
        .single();

      if (!community) {
        throw new Error('Community not found');
      }

      // Fetch posts
      const { data: posts, count: totalPosts } = await supabase
        .from('community_posts')
        .select('id, created_at, is_pinned, is_archived', { count: 'exact' })
        .eq('community_id', communityId)
        .eq('is_archived', false);

      const postsThisWeek = (posts || []).filter(
        (p) => new Date(p.created_at) >= weekStart
      ).length;

      const postsLastWeek = (posts || []).filter(
        (p) => new Date(p.created_at) >= lastWeekStart && new Date(p.created_at) < weekStart
      ).length;

      const pinnedPosts = (posts || []).filter((p) => p.is_pinned).length;

      // Fetch comments
      const postIds = (posts || []).map((p) => p.id);
      let totalComments = 0;
      let commentsThisWeek = 0;
      let commentsLastWeek = 0;
      let hiddenComments = 0;

      if (postIds.length > 0) {
        const { data: comments } = await supabase
          .from('post_comments')
          .select('id, created_at, is_hidden, is_deleted')
          .in('post_id', postIds);

        const activeComments = (comments || []).filter((c) => !c.is_deleted);
        totalComments = activeComments.length;
        commentsThisWeek = activeComments.filter(
          (c) => new Date(c.created_at) >= weekStart
        ).length;
        commentsLastWeek = activeComments.filter(
          (c) => new Date(c.created_at) >= lastWeekStart && new Date(c.created_at) < weekStart
        ).length;
        hiddenComments = activeComments.filter((c) => c.is_hidden).length;
      }

      // Fetch reactions
      let totalReactions = 0;
      let reactionsThisWeek = 0;

      if (postIds.length > 0) {
        const { data: reactions } = await supabase
          .from('post_reactions')
          .select('id, created_at')
          .in('post_id', postIds);

        totalReactions = (reactions || []).length;
        reactionsThisWeek = (reactions || []).filter(
          (r) => new Date(r.created_at) >= weekStart
        ).length;
      }

      // Fetch member events for growth tracking
      const { data: memberEvents } = await supabase
        .from('community_member_events')
        .select('event_type, tier, created_at')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      // Count active members (joins minus leaves)
      let memberCount = 0;
      const tierCounts: Record<string, number> = {};
      
      (memberEvents || []).forEach((event) => {
        if (event.event_type === 'join' || event.event_type === 'upgrade') {
          memberCount++;
          if (event.tier) {
            tierCounts[event.tier] = (tierCounts[event.tier] || 0) + 1;
          }
        } else if (event.event_type === 'leave' || event.event_type === 'downgrade') {
          memberCount = Math.max(0, memberCount - 1);
          if (event.tier) {
            tierCounts[event.tier] = Math.max(0, (tierCounts[event.tier] || 0) - 1);
          }
        }
      });

      // Fallback: count followers if no events
      if (memberCount === 0) {
        const { count: followerCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact' })
          .eq('artist_id', community.artist_id);

        memberCount = followerCount || 0;
      }

      const newMembersThisWeek = (memberEvents || []).filter(
        (e) => e.event_type === 'join' && new Date(e.created_at) >= weekStart
      ).length;

      const newMembersLastWeek = (memberEvents || []).filter(
        (e) =>
          e.event_type === 'join' &&
          new Date(e.created_at) >= lastWeekStart &&
          new Date(e.created_at) < weekStart
      ).length;

      // Calculate growth rates
      const postGrowthRate =
        postsLastWeek > 0 ? ((postsThisWeek - postsLastWeek) / postsLastWeek) * 100 : 0;
      
      const memberGrowthRate =
        newMembersLastWeek > 0
          ? ((newMembersThisWeek - newMembersLastWeek) / newMembersLastWeek) * 100
          : 0;

      // Build tier breakdown
      const membersByTier = Object.entries(tierCounts).map(([tier, count]) => ({
        tier,
        count,
      }));

      // Build history for charts (last 4 weeks)
      const memberGrowthHistory: { date: string; count: number }[] = [];
      const postHistory: { date: string; count: number }[] = [];

      for (let i = 3; i >= 0; i--) {
        const weekDate = subWeeks(now, i);
        const weekLabel = format(weekDate, 'MMM d');
        const weekEnd = subWeeks(now, i - 1);

        const weekPosts = (posts || []).filter(
          (p) => new Date(p.created_at) <= weekEnd
        ).length;

        const weekMembers = (memberEvents || []).filter(
          (e) => e.event_type === 'join' && new Date(e.created_at) <= weekEnd
        ).length;

        postHistory.push({ date: weekLabel, count: weekPosts });
        memberGrowthHistory.push({ date: weekLabel, count: weekMembers });
      }

      // Fetch top engagers (users with most reactions + comments)
      const topEngagers: CommunityAnalytics['topEngagers'] = [];

      // This would require more complex aggregation - simplified version
      // In production, consider using a materialized view or edge function

      setAnalytics({
        totalPosts: totalPosts || 0,
        postsThisWeek,
        postsLastWeek,
        postGrowthRate,
        totalComments,
        commentsThisWeek,
        commentsLastWeek,
        avgCommentsPerPost: totalPosts ? totalComments / totalPosts : 0,
        totalReactions,
        reactionsThisWeek,
        totalMembers: memberCount,
        newMembersThisWeek,
        memberGrowthRate,
        membersByTier,
        topEngagers,
        hiddenComments,
        pinnedPosts,
        memberGrowthHistory,
        postHistory,
      });
    } catch (err) {
      console.error('Error fetching community analytics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
