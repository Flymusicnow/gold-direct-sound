import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppConfig, FALLBACK_APP_CONFIG } from '@/types/trial';

/**
 * Hook for fetching app configuration from GET /config endpoint.
 * 
 * Returns platform-wide settings including:
 * - mvp_mode, payments_enabled
 * - trial policy (allowed lengths, default)
 * - limits (track uploads, etc.)
 * - subscription_products with pricing
 * - feature_unlocks metadata
 */
export const useAppConfig = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig>(FALLBACK_APP_CONFIG);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-config');
      if (error) throw error;
      setConfig(data);
    } catch (err) {
      console.error('Error fetching config:', err);
      // Keep fallback config on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Derived values for convenience
  const isPaymentsEnabled = config.payments_enabled;
  const isMvpMode = config.mvp_mode;

  return {
    config,
    isLoading,
    isPaymentsEnabled,
    isMvpMode,
    refetch: fetchConfig,
  };
};
