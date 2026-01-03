import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { usePostReactions } from '@/hooks/usePostReactions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PaywallCard } from './PaywallCard';
import { useNavigate } from 'react-router-dom';

interface CommunityPost {
  id: string;
  content: string;
  tier_required: string;
  created_at: string;
  media_urls?: string[];
  reaction_count: number;
  comment_count: number;
  is_pinned?: boolean;
  artist_id?: string;
}

interface PostCardProps {
  post: CommunityPost;
  artist: {
    artist_name: string;
    avatar_url: string | null;
  };
  canAccess: boolean;
  onCommentClick?: () => void;
  artistId?: string;
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  bronze: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  silver: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
  gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  diamond: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30'
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  artist,
  canAccess,
  onCommentClick,
  artistId
}) => {
  const navigate = useNavigate();
  const { reactionCount, hasReacted, isLoading, toggleReaction } = usePostReactions(post.id);
  const displayReactionCount = reactionCount;
  const displayCommentCount = post.comment_count;

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleSubscribe = () => {
    const id = artistId || post.artist_id;
    if (id) {
      navigate(`/subscribe/${id}`);
    }
  };

  const handleSeeTiers = () => {
    const id = artistId || post.artist_id;
    if (id) {
      navigate(`/subscribe/${id}`);
    }
  };

  const handleCardClick = () => {
    if (canAccess) {
      navigate(`/post/${post.id}`);
    }
  };

  return (
    <Card className={cn("border-border/50 relative overflow-hidden", post.is_pinned && "ring-1 ring-primary/50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={artist.avatar_url || undefined} />
              <AvatarFallback>{artist.artist_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{artist.artist_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.is_pinned && (
              <Badge variant="outline" className="text-xs">Pinned</Badge>
            )}
            {post.tier_required !== 'free' && (
              <Badge variant="outline" className={cn('capitalize', TIER_COLORS[post.tier_required])}>
                {post.tier_required}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {canAccess ? (
          <div 
            className="cursor-pointer" 
            onClick={handleCardClick}
          >
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-4 grid gap-2">
                {post.media_urls.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt="" 
                    className="rounded-lg max-h-96 object-cover w-full"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative min-h-[120px]">
            {/* Blurred preview */}
            <div className="blur-sm opacity-50 select-none pointer-events-none">
              <p className="text-foreground whitespace-pre-wrap line-clamp-3">
                {post.content}
              </p>
            </div>
            
            {/* Paywall overlay */}
            <PaywallCard
              requiredTier={post.tier_required}
              artistName={artist.artist_name}
              artistId={artistId || post.artist_id || ''}
              onSubscribe={handleSubscribe}
              onSeeTiers={handleSeeTiers}
              variant="overlay"
            />
          </div>
        )}
      </CardContent>
      
      {canAccess && (
        <CardFooter className="pt-0 border-t border-border/50 mt-4">
          <div className="flex items-center gap-4 w-full pt-3">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "gap-2",
                hasReacted && "text-red-500 hover:text-red-600"
              )}
              onClick={toggleReaction}
              disabled={isLoading}
            >
              <Heart className={cn("h-4 w-4", hasReacted && "fill-current")} />
              <span>{displayReactionCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={onCommentClick}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{displayCommentCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 ml-auto"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
