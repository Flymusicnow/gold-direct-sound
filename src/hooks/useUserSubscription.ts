import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserTier = 'free' | 'pro' | 'elite' | 'supporter' | 'enterprise';
export type UserType = 'artist' | 'fan' | 'brand';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trialing' | 'none';

export interface UserSubscription {
  planKey: string;
  planName: string;
  userType: UserType;
  tier: UserTier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  features: string[];
  priceMonthly: number | null;
  priceYearly: number | null;
}

const DEFAULT_FREE_SUBSCRIPTION: UserSubscription = {
  planKey: 'free',
  planName: 'Free',
  userType: 'fan',
  tier: 'free',
  status: 'none',
  expiresAt: null,
  features: [],
  priceMonthly: 0,
  priceYearly: 0
};

export const useUserSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_FREE_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(DEFAULT_FREE_SUBSCRIPTION);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch user's active subscription with plan details
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          premium_plans (
            plan_key,
            plan_name,
            user_type,
            features,
            price_monthly,
            price_yearly
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;

      if (!subData || !subData.premium_plans) {
        // No active subscription, determine user type from roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const roles = roleData?.map(r => r.role) || [];
        const userType: UserType = roles.includes('artist') ? 'artist' : 'fan';
        
        setSubscription({
          ...DEFAULT_FREE_SUBSCRIPTION,
          planKey: `${userType}_free`,
          userType
        });
      } else {
        const plan = subData.premium_plans as any;
        const planKey = plan.plan_key as string;
        
        // Determine tier from plan key
        let tier: UserTier = 'free';
        if (planKey.includes('elite') || planKey.includes('enterprise')) {
          tier = planKey.includes('enterprise') ? 'enterprise' : 'elite';
        } else if (planKey.includes('pro')) {
          tier = 'pro';
        } else if (planKey.includes('supporter')) {
          tier = 'supporter';
        }

        setSubscription({
          planKey,
          planName: plan.plan_name,
          userType: plan.user_type as UserType,
          tier,
          status: subData.status as SubscriptionStatus,
          expiresAt: subData.expires_at,
          features: (plan.features as string[]) || [],
          priceMonthly: plan.price_monthly,
          priceYearly: plan.price_yearly
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
      setSubscription(DEFAULT_FREE_SUBSCRIPTION);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPro = subscription.tier === 'pro' || subscription.tier === 'elite' || subscription.tier === 'enterprise';
  const isElite = subscription.tier === 'elite' || subscription.tier === 'enterprise';
  const isSupporter = subscription.tier === 'supporter';
  const isFree = subscription.tier === 'free';

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    isPro,
    isElite,
    isSupporter,
    isFree
  };
};
