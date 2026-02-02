import { useState, useCallback } from 'react';
import { TrialStatus, DEFAULT_TRIAL_STATUS } from '@/types/trial';

/**
 * STUB: Returns mock data until GET /trial/status endpoint exists.
 * 
 * NO client-side calculations. All values come from mock/API.
 * When /trial/status is ready, replace mock with actual API call.
 */

// TEMP: Placeholder values for development only
// These will be replaced by actual API response
const MOCK_TRIAL_STATUS: TrialStatus = {
  trial_enabled: true,
  trial_length_days: 14, // TEMP: placeholder only - NOT a fallback
  trial_started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // TEMP
  trial_ends_at: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(), // TEMP
  trial_days_left: 11, // TEMP: Backend-calculated value
  trial_state: 'active', // TEMP: Backend-determined value
};

export const useTrialStatus = () => {
  // TODO: Replace with actual API call when GET /trial/status exists
  // const { data, isLoading, refetch } = useQuery(['trial-status'], fetchTrialStatus);
  
  const [isLoading] = useState(false);
  const [trialStatus] = useState<TrialStatus>(MOCK_TRIAL_STATUS);

  const refetch = useCallback(() => {
    // TODO: Implement actual refetch when API exists
    return Promise.resolve();
  }, []);

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
    refetch,
  };
};
