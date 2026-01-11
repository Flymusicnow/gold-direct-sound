import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

export interface VotedEntry {
  entry_id: string;
  campaign_id: string;
  voted_at: string;
  track_title: string;
  cover_url: string | null;
  artist_name: string;
  artist_id: string;
  total_votes: number;
}

interface SpotlightVoteContextType {
  votedEntryIds: Set<string>;
  votedEntries: VotedEntry[];
  votedEntriesLoading: boolean;
  votedEntriesError: boolean;
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
  const [votedEntries, setVotedEntries] = useState<VotedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votedEntriesLoading, setVotedEntriesLoading] = useState(true);
  const [votedEntriesError, setVotedEntriesError] = useState(false);

  // Fetch all user votes for this campaign on mount/campaign change
  const fetchVotes = useCallback(async () => {
    if (!user) {
      setVotedEntryIds(new Set());
      setVotedEntries([]);
      setIsLoading(false);
      setVotedEntriesLoading(false);
      return;
    }

    try {
      setVotedEntriesError(false);
      
      // Build query - if campaignId is provided, filter by it; otherwise get recent votes
      let votesQuery = supabase
        .from('spotlight_votes')
        .select('entry_id, campaign_id, created_at')
        .eq('fan_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        votesQuery = votesQuery.eq('campaign_id', campaignId);
      } else {
        // Limit to recent votes when no campaign specified
        votesQuery = votesQuery.limit(20);
      }

      const { data: votesData, error: votesError } = await votesQuery;

      if (votesError) throw votesError;

      const entryIds = new Set(votesData?.map(vote => vote.entry_id) || []);
      setVotedEntryIds(entryIds);

      // Now fetch full entry details for each voted entry
      if (votesData && votesData.length > 0) {
        const entryIdsList = votesData.map(v => v.entry_id);
        
        const { data: entriesData, error: entriesError } = await supabase
          .from('spotlight_entries')
          .select(`
            id,
            campaign_id,
            artist_id,
            total_votes,
            tracks (
              title,
              cover_url
            ),
            artist_profiles (
              artist_name
            )
          `)
          .in('id', entryIdsList);

        if (entriesError) throw entriesError;

        // Map entries with vote timestamps
        const votedEntriesFormatted: VotedEntry[] = votesData.map(vote => {
          const entry = entriesData?.find(e => e.id === vote.entry_id);
          return {
            entry_id: vote.entry_id,
            campaign_id: vote.campaign_id,
            voted_at: vote.created_at,
            track_title: (entry?.tracks as any)?.title || 'Unknown Track',
            cover_url: (entry?.tracks as any)?.cover_url || null,
            artist_name: (entry?.artist_profiles as any)?.artist_name || 'Unknown Artist',
            artist_id: entry?.artist_id || '',
            total_votes: entry?.total_votes || 0,
          };
        });

        setVotedEntries(votedEntriesFormatted);
      } else {
        setVotedEntries([]);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
      setVotedEntriesError(true);
    } finally {
      setIsLoading(false);
      setVotedEntriesLoading(false);
    }
  }, [user, campaignId]);

  useEffect(() => {
    setIsLoading(true);
    setVotedEntriesLoading(true);
    fetchVotes();
  }, [fetchVotes]);

  // Real-time subscription for vote count updates
  useEffect(() => {
    if (!user || votedEntries.length === 0) return;

    // Get unique campaign IDs from voted entries
    const campaignIds = [...new Set(votedEntries.map(e => e.campaign_id))];
    
    const channel = supabase
      .channel('your-votes-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'spotlight_votes'
        },
        (payload) => {
          // Check if this affects any of our voted entries' campaigns
          const affectedCampaignId = (payload.new as any)?.campaign_id || (payload.old as any)?.campaign_id;
          if (affectedCampaignId && campaignIds.includes(affectedCampaignId)) {
            // Refetch to get updated vote counts
            refreshVotedEntries();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, votedEntries]);

  // Refresh just the voted entries (for real-time updates)
  const refreshVotedEntries = useCallback(async () => {
    if (!user || votedEntries.length === 0) return;

    try {
      const entryIdsList = votedEntries.map(e => e.entry_id);
      
      const { data: entriesData } = await supabase
        .from('spotlight_entries')
        .select('id, total_votes')
        .in('id', entryIdsList);

      if (entriesData) {
        setVotedEntries(prev => prev.map(entry => {
          const updated = entriesData.find(e => e.id === entry.entry_id);
          return updated ? { ...entry, total_votes: updated.total_votes || 0 } : entry;
        }));
      }
    } catch (error) {
      console.error('Error refreshing voted entries:', error);
    }
  }, [user, votedEntries]);

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

      // Refresh votes to get full entry data
      await fetchVotes();

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
  }, [user, campaignId, fetchVotes]);

  const removeVote = useCallback(async (entryId: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    setVotedEntryIds(prev => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
    setVotedEntries(prev => prev.filter(e => e.entry_id !== entryId));

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

      // Rollback optimistic update on error - refetch to restore
      await fetchVotes();

      toast({
        title: "Couldn't remove vote",
        description: "Please try again in a moment.",
        variant: "destructive",
      });

      return false;
    }
  }, [user, fetchVotes]);

  const refreshVotes = useCallback(async () => {
    await fetchVotes();
  }, [fetchVotes]);

  return (
    <SpotlightVoteContext.Provider
      value={{
        votedEntryIds,
        votedEntries,
        votedEntriesLoading,
        votedEntriesError,
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
