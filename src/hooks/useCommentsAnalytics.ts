import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TopCommenter {
  userId: string;
  name: string;
  avatarUrl: string | null;
  commentCount: number;
  isSupporter: boolean;
}

export interface CommentsAnalytics {
  totalComments: number;
  totalReplies: number;
  replyRate: number;
  thisWeekComments: number;
  lastWeekComments: number;
  weekOverWeekChange: number;
  topCommenters: TopCommenter[];
  averageCommentsPerDay: number;
  pinnedCount: number;
  hiddenCount: number;
  reportedCount: number;
}

export function useCommentsAnalytics(artistId: string | null) {
  const [analytics, setAnalytics] = useState<CommentsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [artistId]);

  const fetchAnalytics = async () => {
    if (!artistId) return;

    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all comments for this artist
      const { data: allComments } = await supabase
        .from('comments')
        .select('id, created_at, parent_comment_id, user_id, is_pinned, is_hidden, reported_at')
        .eq('artist_id', artistId);

      if (!allComments) {
        setAnalytics({
          totalComments: 0,
          totalReplies: 0,
          replyRate: 0,
          thisWeekComments: 0,
          lastWeekComments: 0,
          weekOverWeekChange: 0,
          topCommenters: [],
          averageCommentsPerDay: 0,
          pinnedCount: 0,
          hiddenCount: 0,
          reportedCount: 0,
        });
        setLoading(false);
        return;
      }

      // Calculate basic stats
      const topLevelComments = allComments.filter(c => !c.parent_comment_id);
      const replies = allComments.filter(c => c.parent_comment_id);
      
      // Count comments with at least one reply
      const parentIdsWithReplies = new Set(replies.map(r => r.parent_comment_id));
      const commentsWithReplies = topLevelComments.filter(c => parentIdsWithReplies.has(c.id));
      const replyRate = topLevelComments.length > 0 
        ? Math.round((commentsWithReplies.length / topLevelComments.length) * 100) 
        : 0;

      // Week over week
      const thisWeekComments = allComments.filter(
        c => new Date(c.created_at) >= oneWeekAgo
      ).length;
      const lastWeekComments = allComments.filter(
        c => new Date(c.created_at) >= twoWeeksAgo && new Date(c.created_at) < oneWeekAgo
      ).length;
      const weekOverWeekChange = lastWeekComments > 0 
        ? Math.round(((thisWeekComments - lastWeekComments) / lastWeekComments) * 100)
        : thisWeekComments > 0 ? 100 : 0;

      // Average per day (last 30 days)
      const last30DaysComments = allComments.filter(
        c => new Date(c.created_at) >= thirtyDaysAgo
      ).length;
      const averageCommentsPerDay = Math.round((last30DaysComments / 30) * 10) / 10;

      // Moderation counts
      const pinnedCount = allComments.filter(c => c.is_pinned).length;
      const hiddenCount = allComments.filter(c => c.is_hidden).length;
      const reportedCount = allComments.filter(c => c.reported_at).length;

      // Top commenters (excluding the artist themselves)
      const commenterCounts = new Map<string, number>();
      allComments.forEach(c => {
        const count = commenterCounts.get(c.user_id) || 0;
        commenterCounts.set(c.user_id, count + 1);
      });

      const topCommenterIds = Array.from(commenterCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);

      // Fetch profiles for top commenters
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', topCommenterIds);

      // Fetch supporter status
      const { data: supporters } = await supabase
        .from('fan_support_scores')
        .select('fan_user_id')
        .eq('artist_id', artistId)
        .in('fan_user_id', topCommenterIds)
        .gt('score', 0);

      const supporterSet = new Set(supporters?.map(s => s.fan_user_id) || []);

      const topCommenters: TopCommenter[] = topCommenterIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        return {
          userId,
          name: profile?.full_name || 'Anonymous',
          avatarUrl: profile?.avatar_url || null,
          commentCount: commenterCounts.get(userId) || 0,
          isSupporter: supporterSet.has(userId),
        };
      });

      setAnalytics({
        totalComments: allComments.length,
        totalReplies: replies.length,
        replyRate,
        thisWeekComments,
        lastWeekComments,
        weekOverWeekChange,
        topCommenters,
        averageCommentsPerDay,
        pinnedCount,
        hiddenCount,
        reportedCount,
      });
    } catch (error) {
      console.error('Error fetching comments analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refetch: fetchAnalytics };
}
