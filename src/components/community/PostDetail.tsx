import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, Share2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { CommentThread } from './CommentThread';
import { CommentComposer } from './CommentComposer';
import { PaywallCard } from './PaywallCard';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface PostDetailProps {
  postId: string;
  onBack?: () => void;
  onSubscribe?: () => void;
  onSeeTiers?: () => void;
}

interface Post {
  id: string;
  community_id: string;
  author_id: string;
  author_type: 'artist' | 'fan';
  content: string;
  media_urls: string[];
  post_type: string;
  tier_required: string;
  reaction_count: number;
  comment_count: number;
  created_at: string;
}

type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';

const TIER_COLORS: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-slate-900',
  gold: 'bg-yellow-500 text-yellow-900',
  diamond: 'bg-cyan-400 text-cyan-900',
};

export const PostDetail: React.FC<PostDetailProps> = ({
  postId,
  onBack,
  onSubscribe,
  onSeeTiers,
}) => {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [artist, setArtist] = useState<{ id: string; artist_name: string; avatar_url: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [commentKey, setCommentKey] = useState(0);

  const { canAccessTier, isArtistOwner, getMinimumPrice } = useSubscriptionAccess(artist?.id || '');
  const [minPrice, setMinPrice] = useState<number | null>(null);

  const canAccess = post ? canAccessTier(post.tier_required as SubscriptionTier) : false;

  useEffect(() => {
    if (artist?.id) {
      getMinimumPrice().then(setMinPrice);
    }
  }, [artist?.id, getMinimumPrice]);

  const fetchPost = useCallback(async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      const transformedPost: Post = {
        ...postData,
        author_type: postData.author_type as 'artist' | 'fan',
        media_urls: Array.isArray(postData.media_urls)
          ? postData.media_urls.map((url: unknown) => String(url))
          : [],
      };

      setPost(transformedPost);
      setReactionCount(postData.reaction_count || 0);

      // Fetch community and artist info
      const { data: communityData } = await supabase
        .from('communities')
        .select('artist_id')
        .eq('id', postData.community_id)
        .single();

      if (communityData) {
        const { data: artistData } = await supabase
          .from('artist_profiles')
          .select('id, artist_name, avatar_url')
          .eq('id', communityData.artist_id)
          .single();

        setArtist(artistData);
      }

      // Check if user has reacted
      if (user) {
        const { data: reactionData } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        setHasReacted(!!reactionData);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleReaction = async () => {
    if (!user || !post) return;

    try {
      if (hasReacted) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setHasReacted(false);
        setReactionCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('post_reactions')
          .insert({ post_id: post.id, user_id: user.id });
        setHasReacted(true);
        setReactionCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post || !artist) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Post not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      {onBack && (
        <Button variant="ghost" size="sm" className="mb-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={artist.avatar_url || undefined} />
                <AvatarFallback>{artist.artist_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{artist.artist_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            {post.tier_required !== 'free' && (
              <Badge className={TIER_COLORS[post.tier_required] || TIER_COLORS.free}>
                {post.tier_required.charAt(0).toUpperCase() + post.tier_required.slice(1)}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative">
          {canAccess ? (
            <>
              <p className="whitespace-pre-wrap break-words">{post.content}</p>
              {post.media_urls.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {post.media_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="rounded-lg max-h-96 w-full object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <PaywallCard
              requiredTier={post.tier_required}
              artistName={artist.artist_name}
              artistId={artist.id}
              minPrice={minPrice}
              onSubscribe={onSubscribe}
              onSeeTiers={onSeeTiers}
            />
          )}
        </CardContent>

        {canAccess && (
          <CardFooter className="flex-col">
            <div className="flex items-center gap-4 w-full pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReaction}
                className={hasReacted ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-1 ${hasReacted ? 'fill-current' : ''}`} />
                {reactionCount}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>

            <Separator className="mb-4" />

            {/* Comments section */}
            <div className="w-full">
              <h3 className="font-semibold mb-4">Comments</h3>
              <CommentComposer
                postId={post.id}
                onCommentCreated={() => setCommentKey(prev => prev + 1)}
              />
              <div className="mt-6">
                <CommentThread key={commentKey} postId={post.id} maxDepth={3} />
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
