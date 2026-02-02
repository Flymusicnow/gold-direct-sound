import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrialStatus, DEFAULT_TRIAL_STATUS } from '@/types/trial';

/**
 * Hook for fetching trial status from GET /trial/status endpoint.
 * 
 * Returns server-calculated trial state:
 * - trial_days_left (backend-calculated ONLY)
 * - trial_state (active/expired/none/loading)
 * - trial dates (started_at, ends_at)
 * 
 * Frontend NEVER calculates trial logic independently.
 */
export const useTrialStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(DEFAULT_TRIAL_STATUS);

  const fetchTrialStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('get-trial-status', {
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` } 
          : undefined,
      });
      
      if (error) throw error;
      setTrialStatus(data);
    } catch (err) {
      console.error('Error fetching trial status:', err);
      // Keep default status on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrialStatus();
  }, [fetchTrialStatus]);

  // Derived state helpers
  const isTrialActive = trialStatus.trial_state === 'active';
  const isTrialExpired = trialStatus.trial_state === 'expired';
  const hasNoTrial = trialStatus.trial_state === 'none';
  
  // True when we can't show a definitive state
  // (loading, or days_left is null even though state might be 'active')
  const isCheckingTrial = 
    trialStatus.trial_state === 'loading' || 
    (trialStatus.trial_state === 'active' && trialStatus.trial_days_left === null);

  return {
    trialStatus,
    isLoading,
    isTrialActive,
    isTrialExpired,
    hasNoTrial,
    isCheckingTrial,
    refetch: fetchTrialStatus,
  };
};
