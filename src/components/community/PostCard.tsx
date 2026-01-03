import React from 'react';
import { Heart, Lock, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { usePostReactions } from '@/hooks/usePostReactions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: {
    id: string;
    title: string | null;
    content: string;
    tier_required: string;
    created_at: string;
    artist_id: string;
    media_urls?: string[];
  };
  artist: {
    artist_name: string;
    avatar_url: string | null;
  };
  canAccess: boolean;
  commentCount?: number;
  onCommentClick?: () => void;
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
  commentCount = 0,
  onCommentClick
}) => {
  const { reactionCount, hasReacted, isLoading, toggleReaction } = usePostReactions(post.id);

  return (
    <Card className="border-border/50">
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
          {post.tier_required !== 'free' && (
            <Badge variant="outline" className={cn('capitalize', TIER_COLORS[post.tier_required])}>
              {post.tier_required}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {canAccess ? (
          <>
            {post.title && (
              <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            )}
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-4 grid gap-2">
                {post.media_urls.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt="" 
                    className="rounded-lg max-h-96 object-cover w-full"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center bg-muted/30 rounded-lg border border-border/50">
            <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground mb-1">
              {post.tier_required.charAt(0).toUpperCase() + post.tier_required.slice(1)} Members Only
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade your subscription to unlock this content
            </p>
            <Button size="sm" variant="default">
              Upgrade to {post.tier_required}
            </Button>
          </div>
        )}
      </CardContent>
      
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
            disabled={isLoading || !canAccess}
          >
            <Heart className={cn("h-4 w-4", hasReacted && "fill-current")} />
            <span>{reactionCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={onCommentClick}
            disabled={!canAccess}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
