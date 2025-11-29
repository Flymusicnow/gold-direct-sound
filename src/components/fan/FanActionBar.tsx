import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Play, Plus, Bookmark, Star, UserPlus, UserMinus, Share2, ListMusic } from 'lucide-react';
import { FlightdeckItem, useFlightdeck } from '@/contexts/FlightdeckContext';
import { useLikeTrack } from '@/hooks/useLikeTrack';
import { useFollowArtist } from '@/hooks/useFollowArtist';
import { useSpotlightVote } from '@/hooks/useSpotlightVote';
import { ShareModal } from '@/components/ShareModal';
import { StackSelectionModal } from '@/components/stacks/StackSelectionModal';

interface FanActionBarProps {
  item: FlightdeckItem;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  isLiked?: boolean;
  isFollowing?: boolean;
  hasVoted?: boolean;
  contextItems?: FlightdeckItem[];
}

export function FanActionBar({
  item,
  variant = 'horizontal',
  showLabels = true,
  isLiked = false,
  isFollowing = false,
  hasVoted = false,
  contextItems,
}: FanActionBarProps) {
  const { playNow, addToQueue } = useFlightdeck();
  const { liked, toggleLike } = useLikeTrack(item.id, item.artistId, isLiked);
  const { isFollowing: following, toggleFollow } = useFollowArtist(item.artistId, isFollowing);
  const { hasVoted: voted, toggleVote } = useSpotlightVote(
    item.spotlightEntryId || '',
    item.spotlightCampaignId || '',
    item.artistId,
    hasVoted
  );

  const [shareOpen, setShareOpen] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);

  const showSpotlight = !!item.spotlightEntryId && !!item.spotlightCampaignId;

  const buttonClass = variant === 'compact' 
    ? 'h-9 w-9'
    : variant === 'vertical'
    ? 'w-full justify-start'
    : 'flex-1';

  const containerClass = variant === 'vertical'
    ? 'flex flex-col gap-2 w-full'
    : 'flex flex-wrap gap-2 w-full';

  return (
    <>
      <div className={containerClass}>
        {/* Play Now */}
        <Button
          variant="default"
          size={variant === 'compact' ? 'icon' : 'default'}
          className={`${buttonClass} transition-all hover:scale-105 active:scale-95`}
          onClick={() => playNow(item, contextItems)}
        >
          <Play className="h-4 w-4" />
          {showLabels && variant !== 'compact' && <span className="ml-2">Play Now</span>}
        </Button>

        {/* Like */}
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'default'}
          className={`${buttonClass} transition-all hover:scale-105 active:scale-95 ${
            liked ? 'text-primary' : ''
          }`}
          onClick={toggleLike}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-primary' : ''}`} />
          {showLabels && variant !== 'compact' && <span className="ml-2">{liked ? 'Liked' : 'Like'}</span>}
        </Button>

        {/* Add to Flightdeck */}
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'default'}
          className={`${buttonClass} transition-all hover:scale-105 active:scale-95`}
          onClick={() => addToQueue(item)}
        >
          <Plus className="h-4 w-4" />
          {showLabels && variant !== 'compact' && <span className="ml-2">Add to Queue</span>}
        </Button>

        {/* Save to Stack */}
        {item.type === 'track' && (
          <Button
            variant="ghost"
            size={variant === 'compact' ? 'icon' : 'default'}
            className={`${buttonClass} transition-all hover:scale-105 active:scale-95`}
            onClick={() => setStackOpen(true)}
          >
            <Bookmark className="h-4 w-4" />
            {showLabels && variant !== 'compact' && <span className="ml-2">Save to Stack</span>}
          </Button>
        )}

        {/* Spotlight Vote */}
        {showSpotlight && (
          <Button
            variant="ghost"
            size={variant === 'compact' ? 'icon' : 'default'}
            className={`${buttonClass} transition-all hover:scale-105 active:scale-95 ${
              voted ? 'text-primary' : ''
            }`}
            onClick={toggleVote}
          >
            <Star className={`h-4 w-4 ${voted ? 'fill-primary' : ''}`} />
            {showLabels && variant !== 'compact' && <span className="ml-2">{voted ? 'Voted' : 'Vote'}</span>}
          </Button>
        )}

        {/* Follow Artist */}
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'default'}
          className={`${buttonClass} transition-all hover:scale-105 active:scale-95`}
          onClick={toggleFollow}
        >
          {following ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {showLabels && variant !== 'compact' && <span className="ml-2">{following ? 'Unfollow' : 'Follow'}</span>}
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'default'}
          className={`${buttonClass} transition-all hover:scale-105 active:scale-95`}
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          {showLabels && variant !== 'compact' && <span className="ml-2">Share</span>}
        </Button>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        artistName={item.artistName}
        shareUrl={`${window.location.origin}/artist/${item.artistUserId}`}
      />

      {item.type === 'track' && (
        <StackSelectionModal
          isOpen={stackOpen}
          onClose={() => setStackOpen(false)}
          trackId={item.id}
          trackTitle={item.title}
          artistId={item.artistId}
        />
      )}
    </>
  );
}
