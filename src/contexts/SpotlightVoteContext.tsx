import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface SpotlightVoteContextType {
  votedEntryIds: Set<string>;
  isLoading: boolean;
  castVote: (entryId: string) => Promise<boolean>;
  removeVote: (entryId: string) => Promise<boolean>;
  hasVotedFor: (entryId: string) => boolean;
  refreshVotes: () => Promise<void>;
}

const SpotlightVoteContext = createContext<SpotlightVoteContextType | null>(null);

interface SpotlightVoteProviderProps {
  campaignId: string | null;
  children: ReactNode;
}

export function SpotlightVoteProvider({ campaignId, children }: SpotlightVoteProviderProps) {
  const { user } = useAuth();
  const [votedEntryIds, setVotedEntryIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all user votes for this campaign on mount/campaign change
  const fetchVotes = useCallback(async () => {
    if (!user || !campaignId) {
      setVotedEntryIds(new Set());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('spotlight_votes')
        .select('entry_id')
        .eq('fan_user_id', user.id)
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const entryIds = new Set(data?.map(vote => vote.entry_id) || []);
      setVotedEntryIds(entryIds);
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, campaignId]);

  useEffect(() => {
    setIsLoading(true);
    fetchVotes();
  }, [fetchVotes]);

  const hasVotedFor = useCallback((entryId: string) => {
    return votedEntryIds.has(entryId);
  }, [votedEntryIds]);

  const castVote = useCallback(async (entryId: string): Promise<boolean> => {
    if (!user || !campaignId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return false;
    }

    // Optimistic update
    setVotedEntryIds(prev => new Set([...prev, entryId]));

    try {
      const { error } = await supabase
        .from('spotlight_votes')
        .insert({
          fan_user_id: user.id,
          entry_id: entryId,
          campaign_id: campaignId,
          vote_type: 'free',
        });

      if (error) throw error;

      // Trigger gold star confetti animation
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E8BF1A', '#F4D67A', '#C89F0A'],
        shapes: ['star'],
        scalar: 1.2,
      });

      toast({
        title: "Vote recorded!",
        description: "Thank you for voting",
      });

      return true;
    } catch (error: any) {
      console.error('Error casting vote:', error);

      // Handle duplicate vote attempt (unique constraint violation)
      if (error.code === '23505') {
        // Keep the optimistic update - user already voted
        toast({
          title: "Already voted",
          description: "You've already supported this entry.",
        });
        return true; // Not a failure, just already voted
      }

      // Rollback optimistic update on error
      setVotedEntryIds(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });

      toast({
        title: "Couldn't vote right now",
        description: "Please try again in a moment.",
        variant: "destructive",
      });

      return false;
    }
  }, [user, campaignId]);

  const removeVote = useCallback(async (entryId: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    setVotedEntryIds(prev => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });

    try {
      const { error } = await supabase
        .from('spotlight_votes')
        .delete()
        .eq('entry_id', entryId)
        .eq('fan_user_id', user.id);

      if (error) throw error;

      toast({
        title: "Vote removed",
        description: "Your vote has been removed",
      });

      return true;
    } catch (error) {
      console.error('Error removing vote:', error);

      // Rollback optimistic update on error
      setVotedEntryIds(prev => new Set([...prev, entryId]));

      toast({
        title: "Couldn't remove vote",
        description: "Please try again in a moment.",
        variant: "destructive",
      });

      return false;
    }
  }, [user]);

  const refreshVotes = useCallback(async () => {
    await fetchVotes();
  }, [fetchVotes]);

  return (
    <SpotlightVoteContext.Provider
      value={{
        votedEntryIds,
        isLoading,
        castVote,
        removeVote,
        hasVotedFor,
        refreshVotes,
      }}
    >
      {children}
    </SpotlightVoteContext.Provider>
  );
}

export function useSpotlightVotes() {
  const context = useContext(SpotlightVoteContext);
  if (!context) {
    throw new Error('useSpotlightVotes must be used within a SpotlightVoteProvider');
  }
  return context;
}

// Optional hook that returns null if not inside provider (for graceful fallback)
export function useSpotlightVotesOptional() {
  return useContext(SpotlightVoteContext);
}
