import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SUPPORTER_TIERS } from '@/config/supporterTiers';

export interface SupporterTier {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  interval: string;
  description: string | null;
  features: string[];
  sort_order: number;
  is_active: boolean;
  stripe_price_id: string | null;
}

// Convert default tiers to the same format
const getDefaultTiers = (): SupporterTier[] => [
  {
    id: 'default-basic',
    name: SUPPORTER_TIERS.basic.name,
    slug: 'basic',
    price_cents: SUPPORTER_TIERS.basic.price * 100,
    currency: SUPPORTER_TIERS.basic.currency,
    interval: 'month',
    description: 'Support your favorite artist with basic benefits',
    features: [...SUPPORTER_TIERS.basic.features],
    sort_order: 0,
    is_active: true,
    stripe_price_id: SUPPORTER_TIERS.basic.priceId,
  },
  {
    id: 'default-gold',
    name: SUPPORTER_TIERS.gold.name,
    slug: 'gold',
    price_cents: SUPPORTER_TIERS.gold.price * 100,
    currency: SUPPORTER_TIERS.gold.currency,
    interval: 'month',
    description: 'Get the ultimate supporter experience',
    features: [...SUPPORTER_TIERS.gold.features],
    sort_order: 1,
    is_active: true,
    stripe_price_id: SUPPORTER_TIERS.gold.priceId,
  },
];

export function useSupporterTiers(artistId: string) {
  const [tiers, setTiers] = useState<SupporterTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    const fetchTiers = async () => {
      try {
        setLoading(true);
        
        // Try to fetch custom tiers from database
        const { data, error: fetchError } = await supabase
          .from('supporter_tiers')
          .select('*')
          .eq('artist_id', artistId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) {
          console.error('Error fetching tiers:', fetchError);
          // Fall back to default tiers
          setTiers(getDefaultTiers());
        } else if (data && data.length > 0) {
          // Use custom tiers - convert features from Json to string[]
          setTiers(data.map(tier => ({
            ...tier,
            features: Array.isArray(tier.features) 
              ? (tier.features as unknown[]).map(f => String(f))
              : [],
          })));
        } else {
          // No custom tiers, use defaults
          setTiers(getDefaultTiers());
        }
      } catch (err) {
        console.error('Error in useSupporterTiers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTiers(getDefaultTiers());
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, [artistId]);

  return { tiers, loading, error };
}
