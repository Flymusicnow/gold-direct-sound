import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { SubscriptionCTA } from '@/components/community/SubscriptionCTA';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useAuth } from '@/contexts/AuthContext';

interface Artist {
  id: string;
  artist_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  user_id: string;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  banner_media_url: string | null;
  banner_media_type: string | null;
}

const ArtistCommunityPage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);

  const { isSubscribed, isArtistOwner, getMinimumPrice } = useSubscriptionAccess(artistId || '');
  const [minPrice, setMinPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!artistId) return;

      try {
        // Fetch artist
        const { data: artistData } = await supabase
          .from('artist_profiles')
          .select('id, artist_name, avatar_url, banner_url, user_id')
          .eq('id', artistId)
          .single();

        setArtist(artistData);

        // Fetch community
        const { data: communityData } = await supabase
          .from('communities')
          .select('id, name, description, banner_media_url, banner_media_type')
          .eq('artist_id', artistId)
          .single();

        setCommunity(communityData);

        // Fetch min price
        const price = await getMinimumPrice();
        setMinPrice(price);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [artistId, getMinimumPrice]);

  const handleSubscribe = () => {
    if (!artistId) return;
    navigate(`/subscribe/${artistId}`);
  };

  const handleBack = () => {
    navigate(`/artist/${artistId}`);
  };

  const priceDisplay = minPrice ? `${Math.floor(minPrice / 100)} kr/month` : '49 kr/month';
  const showMobileCTA = !isSubscribed && !isArtistOwner;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <CommunityHeader
        artist={artist}
        bannerMediaUrl={community?.banner_media_url || artist?.banner_url || null}
        bannerMediaType={(community?.banner_media_type as 'image' | 'video') || 'image'}
        isLoading={isLoading}
      />

      {/* Back button */}
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Button>
      </div>

      {/* Main content */}
      <div className="container max-w-6xl mx-auto px-4">
        {artistId && (
          <CommunityFeed
            artistId={artistId}
            communityId={community?.id}
          />
        )}
      </div>

      {/* Mobile sticky CTA for non-subscribers */}
      {showMobileCTA && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-bottom">
          <Button onClick={handleSubscribe} className="w-full gap-2">
            <Crown className="h-4 w-4" />
            Join from {priceDisplay}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ArtistCommunityPage;
