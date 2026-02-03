import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrialStatus, DEFAULT_TRIAL_STATUS } from '@/types/trial';

/**
 * Hook for fetching trial status from GET /trial/status endpoint.
 * 
 * Returns server-calculated trial state:
 * - trial.days_left (backend-calculated ONLY)
 * - trial.state (active/expired/none)
 * - trial dates (started_at, ends_at)
 * - trial.type and trial.level_scope (scope-aware)
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

  // Derived state helpers using new nested structure
  const isTrialActive = trialStatus.trial?.state === 'active';
  const isTrialExpired = trialStatus.trial?.state === 'expired';
  const hasNoTrial = trialStatus.trial?.state === 'none';
  
  // True when we're loading or can't show a definitive state
  const isCheckingTrial = isLoading;

  // Get days left (null-safe)
  const daysLeft = trialStatus.trial?.days_left ?? null;

  return {
    trialStatus,
    isLoading,
    isTrialActive,
    isTrialExpired,
    hasNoTrial,
    isCheckingTrial,
    daysLeft,
    refetch: fetchTrialStatus,
  };
};
