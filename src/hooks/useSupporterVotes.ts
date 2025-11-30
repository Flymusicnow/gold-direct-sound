import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SupporterVotes {
  baseVotes: number;
  bonusVotes: number;
  totalVotes: number;
  tier: string | null;
}

export function useSupporterVotes(artistId: string): SupporterVotes {
  const { user } = useAuth();
  const [votes, setVotes] = useState<SupporterVotes>({
    baseVotes: 1,
    bonusVotes: 0,
    totalVotes: 1,
    tier: null,
  });

  useEffect(() => {
    if (!user || !artistId) return;

    const checkSupporterTier = async () => {
      try {
        const { data: subscription } = await supabase
          .from('supporter_subscriptions')
          .select('tier')
          .eq('fan_user_id', user.id)
          .eq('artist_id', artistId)
          .eq('status', 'active')
          .maybeSingle();

        if (!subscription) {
          setVotes({ baseVotes: 1, bonusVotes: 0, totalVotes: 1, tier: null });
          return;
        }

        const bonusVotes = subscription.tier === 'gold' ? 3 : subscription.tier === 'basic' ? 1 : 0;
        setVotes({
          baseVotes: 1,
          bonusVotes,
          totalVotes: 1 + bonusVotes,
          tier: subscription.tier,
        });
      } catch (error) {
        console.error('Error checking supporter tier:', error);
      }
    };

    checkSupporterTier();
  }, [user, artistId]);

  return votes;
}
