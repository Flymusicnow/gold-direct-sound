import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSpotlightVotesOptional } from "@/contexts/SpotlightVoteContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { LoginPromptOverlay } from "@/components/LoginPromptOverlay";

interface SpotlightVoteButtonProps {
  entryId: string;
  artistUserId?: string;
  onVoteSuccess?: () => void;
}

export default function SpotlightVoteButton({ entryId, artistUserId, onVoteSuccess }: SpotlightVoteButtonProps) {
  const { user } = useAuth();
  const location = useLocation();
  const voteContext = useSpotlightVotesOptional();
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check if this is the user's own entry
  const isOwnEntry = user?.id === artistUserId;

  // Use context state if available
  const hasVoted = voteContext?.hasVotedFor(entryId) ?? false;

  const handleVote = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!voteContext) {
      console.error('SpotlightVoteButton used outside SpotlightVoteProvider');
      return;
    }

    setLoading(true);
    try {
      let success: boolean;
      if (hasVoted) {
        success = await voteContext.removeVote(entryId);
      } else {
        success = await voteContext.castVote(entryId);
      }

      if (success && onVoteSuccess) {
        onVoteSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  // Show "Your Entry" badge instead of vote button for own entries
  if (isOwnEntry) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Your Entry
      </Badge>
    );
  }

  return (
    <>
      <Button
        onClick={handleVote}
        disabled={loading || voteContext?.isLoading}
        variant={hasVoted ? "default" : "outline"}
        size="sm"
        className={`min-h-[44px] px-4 ${hasVoted ? "bg-gradient-to-r from-[#E8BF1A] to-[#B8960F]" : ""}`}
      >
        <Heart className={`h-4 w-4 mr-1.5 ${hasVoted ? 'fill-current' : ''}`} />
        {hasVoted ? 'Voted' : 'Vote'}
      </Button>
      
      <LoginPromptOverlay
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        action="vote"
        redirectPath={location.pathname}
      />
    </>
  );
}
