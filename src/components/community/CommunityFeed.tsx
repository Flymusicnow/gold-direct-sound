import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { SubscriptionCTA } from './SubscriptionCTA';
import { FanLeaderboard } from './FanLeaderboard';
import { MyEngagementCard } from './MyEngagementCard';
import { CommunityPresence } from './CommunityPresence';
import { NotificationPrefsDialog } from './NotificationPrefsDialog';

interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  author_type: 'artist' | 'fan';
  content: string;
  media_urls: string[];
  post_type: 'text' | 'image' | 'video' | 'audio';
  tier_required: string;
  is_pinned: boolean;
  is_archived: boolean;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

interface CommunityFeedProps {
  artistId: string;
  communityId?: string;
}

type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ artistId, communityId }) => {
  const { user } = useAuth();
  const { canAccessTier, isArtistOwner, isLoading: subscriptionLoading } = useSubscriptionAccess(artistId);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [artist, setArtist] = useState<{ artist_name: string; avatar_url: string | null; user_id: string } | null>(null);
  const [community, setCommunity] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Dual ID lookup: try id first, then user_id
      const { data: artistById } = await supabase
        .from('artist_profiles')
        .select('id, artist_name, avatar_url, user_id')
        .eq('id', artistId)
        .maybeSingle();
      
      let artistData = artistById;
      if (!artistData) {
        const { data: artistByUserId } = await supabase
          .from('artist_profiles')
          .select('id, artist_name, avatar_url, user_id')
          .eq('user_id', artistId)
          .maybeSingle();
        artistData = artistByUserId;
      }
      
      setArtist(artistData);
      
      // Use resolved artist ID for community query
      const resolvedArtistId = artistData?.id || artistId;

      // Fetch or create community using resolved artist ID
      let communityData = null;
      if (communityId) {
        const { data } = await supabase
          .from('communities')
          .select('id, name')
          .eq('id', communityId)
          .maybeSingle();
        communityData = data;
      } else {
        const { data } = await supabase
          .from('communities')
          .select('id, name')
          .eq('artist_id', resolvedArtistId)
          .maybeSingle();
        communityData = data;
      }
      setCommunity(communityData);

      if (!communityData) {
        setIsLoading(false);
        return;
      }

      // Fetch posts from community_posts - RLS handles access control
      const { data: postsData, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityData.id)
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      // Transform posts to ensure media_urls is always an array
      const transformedPosts: CommunityPost[] = (postsData || []).map(post => ({
        ...post,
        author_type: post.author_type as 'artist' | 'fan',
        post_type: post.post_type as 'text' | 'image' | 'video' | 'audio',
        media_urls: Array.isArray(post.media_urls) 
          ? post.media_urls.map((url: unknown) => String(url))
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
        {/* Presence indicator */}
        {community && (
          <CommunityPresence 
            communityId={community.id} 
            artistUserId={artist?.user_id}
          />
        )}
        
        {/* Notification settings */}
        {user && community && (
          <NotificationPrefsDialog communityId={community.id} />
        )}
        
        {/* Leaderboard */}
        {community && (
          <FanLeaderboard communityId={community.id} limit={5} />
        )}
        
        {/* User's engagement stats */}
        {user && community && (
          <MyEngagementCard communityId={community.id} />
        )}
        
        <SubscriptionCTA
          artistId={artistId}
          artistName={artist.artist_name}
        />
      </div>
    </div>
  );
};
