import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LiveSpotlightBoostProps {
  streamId: string;
  artistId: string;
}

export function LiveSpotlightBoost({ streamId, artistId }: LiveSpotlightBoostProps) {
  const { user } = useAuth();
  const [spotlightEntry, setSpotlightEntry] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpotlightEntry();
    checkVoteStatus();
  }, [artistId, streamId, user]);

  const fetchSpotlightEntry = async () => {
    try {
      // Get active campaign
      const { data: campaign } = await supabase
        .from('spotlight_campaigns')
        .select('id')
        .eq('status', 'active')
        .single();

      if (!campaign) {
        setLoading(false);
        return;
      }

      // Get artist's entry in active campaign
      const { data: entry, error } = await supabase
        .from('spotlight_entries')
        .select('*, tracks(title)')
        .eq('artist_id', artistId)
        .eq('campaign_id', campaign.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      
      setSpotlightEntry(entry);
      if (entry) {
        setVoteCount(entry.total_votes || 0);
      }
    } catch (error) {
      console.error('Error fetching spotlight entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    if (!user || !streamId) return;

    try {
      const { data, error } = await supabase
        .from('live_spotlight_votes')
        .select('id')
        .eq('stream_id', streamId)
        .eq('voter_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasVoted(!!data);
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const handleVote = async () => {
    if (!user || !spotlightEntry) {
      toast.error('You must be logged in to vote');
      return;
    }

    try {
      const { error } = await supabase.from('live_spotlight_votes').insert({
        stream_id: streamId,
        voter_user_id: user.id,
        entry_id: spotlightEntry.id,
      });

      if (error) throw error;

      setHasVoted(true);
      setVoteCount((prev) => prev + 1);
      toast.success('Live Spotlight vote sent! +10 XP');
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error('Failed to send vote');
    }
  };

  if (loading || !spotlightEntry) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Live Spotlight Boost
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Support this artist's Spotlight entry: <strong>{spotlightEntry.tracks?.title}</strong>
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold">{voteCount} votes</span>
          </div>
          <Button
            onClick={handleVote}
            disabled={hasVoted}
            size="sm"
            className="bg-gradient-gold"
          >
            {hasVoted ? 'Voted!' : 'Boost +10 XP'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
