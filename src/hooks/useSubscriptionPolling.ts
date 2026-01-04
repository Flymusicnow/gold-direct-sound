import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PollingStatus = 'idle' | 'polling' | 'active' | 'timeout' | 'error';

interface UseSubscriptionPollingResult {
  status: PollingStatus;
  startPolling: () => void;
  stopPolling: () => void;
}

export function useSubscriptionPolling(
  artistId: string | undefined,
  enabled: boolean = false
): UseSubscriptionPollingResult {
  const { user } = useAuth();
  const [status, setStatus] = useState<PollingStatus>('idle');

  const stopPolling = useCallback(() => {
    setStatus('idle');
  }, []);

  const startPolling = useCallback(() => {
    if (!user || !artistId) return;
    setStatus('polling');
  }, [user, artistId]);

  useEffect(() => {
    if (status !== 'polling' || !user || !artistId) return;

    let pollCount = 0;
    const maxPolls = 15; // 30 seconds with 2s interval
    const pollInterval = 2000;

    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('supporter_subscriptions')
          .select('status')
          .eq('artist_id', artistId)
          .eq('fan_user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('Subscription polling error:', error);
          setStatus('error');
          return;
        }

        if (data?.status === 'active') {
          setStatus('active');
          return;
        }

        pollCount++;
        if (pollCount >= maxPolls) {
          setStatus('timeout');
          return;
        }

        // Continue polling
        setTimeout(checkSubscription, pollInterval);
      } catch (err) {
        console.error('Subscription polling exception:', err);
        setStatus('error');
      }
    };

    // Start polling after initial delay
    const initialDelay = setTimeout(checkSubscription, 1000);

    return () => {
      clearTimeout(initialDelay);
    };
  }, [status, user, artistId]);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && status === 'idle') {
      startPolling();
    }
  }, [enabled, status, startPolling]);

  return { status, startPolling, stopPolling };
}
