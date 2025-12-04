import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StripeConnectStatus {
  hasAccount: boolean;
  status: 'not_started' | 'pending' | 'onboarding' | 'active' | 'restricted';
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
}

export function useStripeConnect() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StripeConnectStatus>({
    hasAccount: false,
    status: 'not_started',
    payoutsEnabled: false,
    detailsSubmitted: false,
    chargesEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect-refresh', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (fnError) throw fnError;

      setStatus({
        hasAccount: data.hasAccount || false,
        status: data.status || 'not_started',
        payoutsEnabled: data.payoutsEnabled || false,
        detailsSubmitted: data.detailsSubmitted || false,
        chargesEnabled: data.chargesEnabled || false,
      });
    } catch (err) {
      console.error('Error refreshing Stripe Connect status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startOnboarding = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');

    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect-onboard', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      console.error('Error starting Stripe Connect onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    refreshStatus,
    startOnboarding,
  };
}
