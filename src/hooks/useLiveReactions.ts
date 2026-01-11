import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReactionType = 'fire' | 'heart' | 'clap' | 'wow' | 'laugh';

interface Reaction {
  id: string;
  type: ReactionType;
  userId: string;
  createdAt: string;
}

interface ReactionCounts {
  fire: number;
  heart: number;
  clap: number;
  wow: number;
  laugh: number;
}

interface UseLiveReactionsReturn {
  recentReactions: Reaction[];
  reactionCounts: ReactionCounts;
  sendReaction: (type: ReactionType) => Promise<void>;
  isRateLimited: boolean;
}

const RATE_LIMIT_MS = 2000; // 1 reaction per 2 seconds

/**
 * useLiveReactions - Manages real-time audience reactions
 * Rate limited to prevent spam
 */
export function useLiveReactions(streamId: string): UseLiveReactionsReturn {
  const { user } = useAuth();
  const [recentReactions, setRecentReactions] = useState<Reaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
    fire: 0,
    heart: 0,
    clap: 0,
    wow: 0,
    laugh: 0,
  });
  const [lastReactionTime, setLastReactionTime] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Subscribe to reactions
  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`live_reactions:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_reactions',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const reaction: Reaction = {
            id: payload.new.id,
            type: payload.new.reaction_type as ReactionType,
            userId: payload.new.user_id,
            createdAt: payload.new.created_at,
          };
          
          // Add to recent reactions (for animation)
          setRecentReactions(prev => [...prev.slice(-20), reaction]);
          
          // Update counts
          setReactionCounts(prev => ({
            ...prev,
            [reaction.type]: prev[reaction.type] + 1,
          }));
          
          // Auto-remove after animation (3s)
          setTimeout(() => {
            setRecentReactions(prev => prev.filter(r => r.id !== reaction.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // Rate limit reset
  useEffect(() => {
    if (!isRateLimited) return;
    
    const timeout = setTimeout(() => {
      setIsRateLimited(false);
    }, RATE_LIMIT_MS);
    
    return () => clearTimeout(timeout);
  }, [isRateLimited]);

  // Send reaction
  const sendReaction = useCallback(async (type: ReactionType) => {
    if (!user || !streamId) return;
    
    // Rate limiting
    const now = Date.now();
    if (now - lastReactionTime < RATE_LIMIT_MS) {
      setIsRateLimited(true);
      return;
    }
    
    try {
      setLastReactionTime(now);
      
      const { error } = await supabase
        .from('live_reactions')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          reaction_type: type,
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  }, [user, streamId, lastReactionTime]);

  return {
    recentReactions,
    reactionCounts,
    sendReaction,
    isRateLimited,
  };
}
