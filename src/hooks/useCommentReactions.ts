import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReactionRow {
  emoji: string;
  user_id: string;
}

export function useCommentReactions(commentId: string, isVideoComment: boolean = false) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReactions = async () => {
    const columnFilter = isVideoComment ? 'video_comment_id' : 'comment_id';
    
    // Use raw query since types may not be updated yet
    const { data: reactionsData, error } = await supabase
      .from('comment_reactions' as any)
      .select('emoji, user_id')
      .eq(columnFilter, commentId);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (reactionsData) {
      const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();
      
      (reactionsData as unknown as ReactionRow[]).forEach((r) => {
        const existing = emojiMap.get(r.emoji) || { count: 0, hasReacted: false };
        emojiMap.set(r.emoji, {
          count: existing.count + 1,
          hasReacted: existing.hasReacted || r.user_id === userId,
        });
      });

      setReactions(
        Array.from(emojiMap.entries()).map(([emoji, data]) => ({
          emoji,
          ...data,
        }))
      );
    }
  };

  useEffect(() => {
    fetchReactions();

    // Subscribe to realtime updates
    const columnFilter = isVideoComment ? 'video_comment_id' : 'comment_id';
    const channel = supabase
      .channel(`reactions_${commentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
          filter: `${columnFilter}=eq.${commentId}`,
        },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commentId, isVideoComment]);

  const toggleReaction = async (emoji: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const columnFilter = isVideoComment ? 'video_comment_id' : 'comment_id';
      
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('comment_reactions' as any)
        .select('id')
        .eq(columnFilter, commentId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase
          .from('comment_reactions' as any)
          .delete()
          .eq('id', (existing as any).id);
      } else {
        // Add reaction
        const insertData: Record<string, string> = {
          user_id: user.id,
          emoji,
        };
        if (isVideoComment) {
          insertData.video_comment_id = commentId;
        } else {
          insertData.comment_id = commentId;
        }
        
        await supabase
          .from('comment_reactions' as any)
          .insert(insertData as any);
      }

      fetchReactions();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return { reactions, toggleReaction, loading, refetch: fetchReactions };
}
