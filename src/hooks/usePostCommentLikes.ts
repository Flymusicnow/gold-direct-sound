import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CommentLikeData {
  likeCount: number;
  hasLiked: boolean;
}

export function usePostCommentLikes(commentIds: string[]) {
  const { user } = useAuth();
  const [likesMap, setLikesMap] = useState<Map<string, CommentLikeData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const fetchLikes = useCallback(async () => {
    if (commentIds.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all likes for the given comments
      const { data: allLikes, error } = await supabase
        .from('post_comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

      if (error) throw error;

      // Build likes map
      const newMap = new Map<string, CommentLikeData>();
      
      commentIds.forEach(commentId => {
        const commentLikes = allLikes?.filter(l => l.comment_id === commentId) || [];
        newMap.set(commentId, {
          likeCount: commentLikes.length,
          hasLiked: user ? commentLikes.some(l => l.user_id === user.id) : false,
        });
      });

      setLikesMap(newMap);
    } catch (err) {
      console.error('Error fetching post comment likes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [commentIds.join(','), user?.id]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = useCallback(async (commentId: string) => {
    if (!user) return;

    const current = likesMap.get(commentId);
    const hasLiked = current?.hasLiked || false;

    // Optimistic update
    setLikesMap(prev => {
      const newMap = new Map(prev);
      newMap.set(commentId, {
        likeCount: (current?.likeCount || 0) + (hasLiked ? -1 : 1),
        hasLiked: !hasLiked,
      });
      return newMap;
    });

    try {
      if (hasLiked) {
        const { error } = await supabase
          .from('post_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert optimistic update
      setLikesMap(prev => {
        const newMap = new Map(prev);
        newMap.set(commentId, current || { likeCount: 0, hasLiked: false });
        return newMap;
      });
    }
  }, [user, likesMap]);

  const getLikeData = useCallback((commentId: string): CommentLikeData => {
    return likesMap.get(commentId) || { likeCount: 0, hasLiked: false };
  }, [likesMap]);

  return {
    getLikeData,
    toggleLike,
    isLoading,
    refetch: fetchLikes,
  };
}
