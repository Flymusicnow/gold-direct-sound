import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SpotlightVoteButtonProps {
  entryId: string;
  onVoteSuccess: () => void;
}

export default function SpotlightVoteButton({ entryId, onVoteSuccess }: SpotlightVoteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkVoteStatus();
    }
  }, [user, entryId]);

  const checkVoteStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('spotlight_votes')
        .select('id')
        .eq('entry_id', entryId)
        .eq('fan_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasVoted(!!data);
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const handleVote = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      if (hasVoted) {
        // Unvote
        const { error } = await supabase
          .from('spotlight_votes')
          .delete()
          .eq('entry_id', entryId)
          .eq('fan_user_id', user.id);

        if (error) throw error;

        setHasVoted(false);
        toast({
          title: "Vote removed",
          description: "Your vote has been removed",
        });
      } else {
        // Vote
        // First get the campaign_id for this entry
        const { data: entryData, error: entryError } = await supabase
          .from('spotlight_entries')
          .select('campaign_id')
          .eq('id', entryId)
          .single();

        if (entryError) throw entryError;

        const { error } = await supabase
          .from('spotlight_votes')
          .insert([{
            entry_id: entryId,
            campaign_id: entryData.campaign_id,
            fan_user_id: user.id,
            vote_type: 'free',
          }]);

        if (error) throw error;

        setHasVoted(true);
        toast({
          title: "Vote recorded!",
          description: "Thank you for voting",
        });
      }

      onVoteSuccess();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={loading}
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      className={hasVoted ? "bg-gradient-to-r from-[#E8BF1A] to-[#B8960F]" : ""}
    >
      <Heart className={`h-4 w-4 mr-1 ${hasVoted ? 'fill-current' : ''}`} />
      {hasVoted ? 'Voted' : 'Vote'}
    </Button>
  );
}