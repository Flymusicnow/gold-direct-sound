import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';

const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  diamond: 4
};

export const useSubscriptionAccess = (artistId: string) => {
  const { user } = useAuth();
  const [userTier, setUserTier] = useState<SubscriptionTier>('free');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isArtistOwner, setIsArtistOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user || !artistId) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if user is the artist
      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('user_id')
        .eq('id', artistId)
        .maybeSingle();

      if (artistProfile?.user_id === user.id) {
        setIsArtistOwner(true);
        setUserTier('diamond'); // Artists have full access to their own content
        setIsSubscribed(true);
        setIsLoading(false);
        return;
      }

      // Check active subscription
      const { data: subscription } = await supabase
        .from('supporter_subscriptions')
        .select('tier, status, current_period_end')
        .eq('fan_user_id', user.id)
        .eq('artist_id', artistId)
        .eq('status', 'active')
        .maybeSingle();

      if (subscription) {
        setUserTier(subscription.tier as SubscriptionTier);
        setIsSubscribed(true);
        setSubscriptionEnd(subscription.current_period_end ? new Date(subscription.current_period_end) : null);
      } else {
        setUserTier('free');
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, artistId]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const canAccessTier = useCallback((requiredTier: SubscriptionTier): boolean => {
    if (isArtistOwner) return true;
    return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
  }, [userTier, isArtistOwner]);

  const getMinimumPrice = useCallback(async (): Promise<number | null> => {
    try {
      const { data } = await supabase
        .from('supporter_tiers')
        .select('price_cents')
        .eq('artist_id', artistId)
        .eq('is_active', true)
        .order('price_cents', { ascending: true })
        .limit(1)
        .maybeSingle();

      return data?.price_cents ?? null;
    } catch (error) {
      console.error('Error fetching minimum price:', error);
      return null;
    }
  }, [artistId]);

  return {
    userTier,
    isSubscribed,
    isArtistOwner,
    isLoading,
    subscriptionEnd,
    canAccessTier,
    getMinimumPrice,
    refetch: fetchSubscriptionStatus
  };
};
