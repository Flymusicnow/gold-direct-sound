import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { SubscriptionCTA } from './SubscriptionCTA';
import { Json } from '@/integrations/supabase/types';

interface Post {
  id: string;
  title: string | null;
  content: string;
  tier_required: string;
  created_at: string;
  artist_id: string;
  media_urls: string[];
  community_id: string | null;
}

interface CommunityFeedProps {
  artistId: string;
  communityId?: string;
}

type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ artistId, communityId }) => {
  const { user } = useAuth();
  const { canAccessTier, isArtistOwner, isLoading: subscriptionLoading } = useSubscriptionAccess(artistId);
  const [posts, setPosts] = useState<Post[]>([]);
  const [artist, setArtist] = useState<{ artist_name: string; avatar_url: string | null } | null>(null);
  const [community, setCommunity] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch artist profile
      const { data: artistData } = await supabase
        .from('artist_profiles')
        .select('artist_name, avatar_url')
        .eq('id', artistId)
        .single();
      
      setArtist(artistData);

      // Fetch or create community
      let communityData = null;
      if (communityId) {
        const { data } = await supabase
          .from('communities')
          .select('id, name')
          .eq('id', communityId)
          .single();
        communityData = data;
      } else {
        const { data } = await supabase
          .from('communities')
          .select('id, name')
          .eq('artist_id', artistId)
          .single();
        communityData = data;
      }
      setCommunity(communityData);

      // Fetch posts - RLS will handle access control
      const { data: postsData, error } = await supabase
        .from('artist_posts')
        .select('*')
        .eq('artist_id', artistId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      // Transform posts to ensure media_urls is always an array
      const transformedPosts: Post[] = (postsData || []).map(post => ({
        ...post,
        media_urls: Array.isArray(post.media_urls) 
          ? (post.media_urls as Json[]).map(url => String(url))
          : []
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [artistId, communityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Artist not found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main feed column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Post composer - only for artist or authenticated users */}
        {user && community && (
          <PostComposer
            communityId={community.id}
            artistId={artistId}
            isArtist={isArtistOwner}
            onPostCreated={fetchData}
          />
        )}

        {/* Posts list */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No posts yet. {isArtistOwner ? 'Create your first post!' : 'Check back soon!'}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              artist={artist}
              canAccess={canAccessTier(post.tier_required as SubscriptionTier)}
            />
          ))
        )}
      </div>

      {/* Sidebar column */}
      <div className="space-y-6">
        <SubscriptionCTA
          artistId={artistId}
          artistName={artist.artist_name}
        />
      </div>
    </div>
  );
};
