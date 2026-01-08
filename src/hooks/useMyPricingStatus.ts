import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PricingStatusResult {
  has_override: boolean;
  status: 'beta_free' | 'discounted' | 'standard';
  discount_percent: number;
  scope: string | null;
  expires_at: string | null;
}

/**
 * Hook for artists to get their own pricing status (read-only)
 * Uses the secure RPC function that checks based on auth.uid()
 */
export function useMyPricingStatus() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-pricing-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_pricing_status');
      if (error) throw error;
      return data as unknown as PricingStatusResult;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    pricingStatus: data,
    hasBetaAccess: data?.status === 'beta_free',
    hasDiscount: data?.has_override && data.discount_percent > 0,
    discountPercent: data?.discount_percent ?? 0,
    expiresAt: data?.expires_at ? new Date(data.expires_at) : null,
    isLoading,
    error,
  };
}
