import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/community/PostCard';
import { PaywallCard } from '@/components/community/PaywallCard';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';

interface FeedPost {
  id: string;
  content: string;
  tier_required: string;
  created_at: string;
  media_urls: string[];
  reaction_count: number;
  comment_count: number;
  is_pinned: boolean;
  community_id: string;
  artist_id: string;
  artist_name: string;
  avatar_url: string | null;
  author_id: string;
  author_type: 'artist' | 'fan';
  artist_user_id?: string;
}

const POSTS_PER_PAGE = 20;

const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (cursorDate?: string) => {
    if (!user) return;

    try {
      // Get followed artist IDs
      const { data: follows } = await supabase
        .from('follows')
        .select('artist_id')
        .eq('fan_id', user.id);

      if (!follows || follows.length === 0) {
        setIsLoading(false);
        return;
      }

      const artistIds = follows.map(f => f.artist_id);

      // Get communities for followed artists
      const { data: communities } = await supabase
        .from('communities')
        .select('id, artist_id')
        .in('artist_id', artistIds);

      if (!communities || communities.length === 0) {
        setIsLoading(false);
        return;
      }

      const communityIds = communities.map(c => c.id);
      const communityArtistMap = Object.fromEntries(
        communities.map(c => [c.id, c.artist_id])
      );

      // Fetch posts with cursor-based pagination
      let query = supabase
        .from('community_posts')
        .select('*')
        .in('community_id', communityIds)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_PAGE);

      if (cursorDate) {
        query = query.lt('created_at', cursorDate);
      }

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching feed posts:', error);
        return;
      }

      // Get artist profiles for the posts
      const uniqueArtistIds = [...new Set(postsData?.map(p => communityArtistMap[p.community_id]) || [])];
      const { data: artistProfiles } = await supabase
        .from('artist_profiles')
        .select('id, artist_name, avatar_url, user_id')
        .in('id', uniqueArtistIds);

      const artistMap = Object.fromEntries(
        (artistProfiles || []).map(a => [a.id, a])
      );

      // Transform posts
      const transformedPosts: FeedPost[] = (postsData || []).map(post => {
        const artistId = communityArtistMap[post.community_id];
        const artist = artistMap[artistId] || { artist_name: 'Unknown Artist', avatar_url: null, user_id: undefined };
        return {
          id: post.id,
          content: post.content,
          tier_required: post.tier_required,
          created_at: post.created_at,
          media_urls: Array.isArray(post.media_urls) ? post.media_urls.map(String) : [],
          reaction_count: post.reaction_count,
          comment_count: post.comment_count,
          is_pinned: post.is_pinned,
          community_id: post.community_id,
          artist_id: artistId,
          artist_name: artist.artist_name,
          avatar_url: artist.avatar_url,
          author_id: post.author_id,
          author_type: post.author_type as 'artist' | 'fan',
          artist_user_id: artist.user_id
        };
      });

      if (cursorDate) {
        setPosts(prev => [...prev, ...transformedPosts]);
      } else {
        setPosts(transformedPosts);
      }

      setHasMore(transformedPosts.length === POSTS_PER_PAGE);
      if (transformedPosts.length > 0) {
        setCursor(transformedPosts[transformedPosts.length - 1].created_at);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && cursor) {
          fetchPosts(cursor);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, cursor, fetchPosts]);

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your feed</p>
      </div>
    );
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your feed is empty</h2>
            <p className="text-muted-foreground mb-4">
              Follow artists to see their community posts here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Community Feed</h1>
        
        <div className="space-y-6">
          {posts.map(post => (
            <FeedPostCard
              key={post.id}
              post={post}
              onPostClick={handlePostClick}
            />
          ))}
        </div>

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoading && hasMore && (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
        </div>
      </div>
    </div>
  );
};

// Separate component for feed posts with subscription check
const FeedPostCard: React.FC<{
  post: FeedPost;
  onPostClick: (postId: string) => void;
}> = ({ post, onPostClick }) => {
  const navigate = useNavigate();
  const { canAccessTier } = useSubscriptionAccess(post.artist_id);
  
  const canAccess = canAccessTier(post.tier_required as 'free' | 'bronze' | 'silver' | 'gold' | 'diamond');

  const handleSubscribe = () => {
    navigate(`/subscribe/${post.artist_id}`);
  };

  const handleSeeTiers = () => {
    navigate(`/subscribe/${post.artist_id}`);
  };

  return (
    <div className="relative">
      <PostCard
        post={post}
        artist={{ artist_name: post.artist_name, avatar_url: post.avatar_url, user_id: post.artist_user_id }}
        canAccess={canAccess}
        onCommentClick={() => onPostClick(post.id)}
        communityArtistUserId={post.artist_user_id}
      />
      
      {!canAccess && post.tier_required !== 'free' && (
        <PaywallCard
          requiredTier={post.tier_required}
          artistName={post.artist_name}
          artistId={post.artist_id}
          onSubscribe={handleSubscribe}
          onSeeTiers={handleSeeTiers}
          variant="overlay"
        />
      )}
    </div>
  );
};

export default FeedPage;
