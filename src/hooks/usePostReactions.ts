import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const usePostReactions = (postId: string) => {
  const { user } = useAuth();
  const [reactionCount, setReactionCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReactions = useCallback(async () => {
    try {
      // Get count
      const { count, error: countError } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) throw countError;
      setReactionCount(count ?? 0);

      // Check if user has reacted
      if (user) {
        const { data: userReaction, error: userError } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userError) throw userError;
        setHasReacted(!!userReaction);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const toggleReaction = async () => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }

    setIsLoading(true);
    try {
      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setHasReacted(false);
        setReactionCount(prev => Math.max(0, prev - 1));
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: 'heart' });

        if (error) throw error;
        setHasReacted(true);
        setReactionCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reactionCount,
    hasReacted,
    isLoading,
    toggleReaction,
    refetch: fetchReactions
  };
};
