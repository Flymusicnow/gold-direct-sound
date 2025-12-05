import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FeatureAccessReason = 
  | 'allowed' 
  | 'upgrade_required' 
  | 'not_logged_in' 
  | 'feature_disabled'
  | 'free_access'
  | 'pro_access'
  | 'elite_access';

export interface FeatureAccessResult {
  allowed: boolean;
  reason: FeatureAccessReason;
  requiredTier: 'pro' | 'elite' | 'supporter' | 'enterprise' | null;
  isLoading: boolean;
}

export const useFeatureAccess = (featureKey: string): FeatureAccessResult => {
  const { user } = useAuth();
  const [result, setResult] = useState<FeatureAccessResult>({
    allowed: false,
    reason: 'not_logged_in',
    requiredTier: null,
    isLoading: true
  });

  const checkAccess = useCallback(async () => {
    if (!user?.id) {
      setResult({
        allowed: false,
        reason: 'not_logged_in',
        requiredTier: null,
        isLoading: false
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_feature_access', {
        _user_id: user.id,
        _feature_key: featureKey
      });

      if (error) throw error;

      const accessData = data as { allowed: boolean; reason: string; required_tier?: string };
      
      let requiredTier: FeatureAccessResult['requiredTier'] = null;
      if (accessData.required_tier) {
        requiredTier = accessData.required_tier as FeatureAccessResult['requiredTier'];
      }

      setResult({
        allowed: accessData.allowed,
        reason: accessData.reason as FeatureAccessReason,
        requiredTier,
        isLoading: false
      });
    } catch (err) {
      console.error('Error checking feature access:', err);
      // Default to allowed if check fails (fail-open for better UX)
      setResult({
        allowed: true,
        reason: 'allowed',
        requiredTier: null,
        isLoading: false
      });
    }
  }, [user?.id, featureKey]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return result;
};

// Simpler hook for quick boolean checks
export const useCanAccessFeature = (featureKey: string): boolean => {
  const { allowed, isLoading } = useFeatureAccess(featureKey);
  return isLoading ? true : allowed; // Default to true while loading
};
