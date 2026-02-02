import { useState, useCallback } from 'react';
import { AppConfig } from '@/types/trial';
import { MVP_CONFIG, isPaymentsEnabled as checkPaymentsEnabled } from '@/config/mvpConfig';

/**
 * STUB: Returns mock config until GET /config endpoint exists.
 * 
 * When available, AppConfig becomes the SINGLE SOURCE OF TRUTH.
 * MVP_CONFIG is only used as fallback during bootstrap.
 */

// TEMP: Mock config for development
// Will be replaced by actual API response from GET /config
const MOCK_APP_CONFIG: AppConfig = {
  trial_enabled: true,
  trial_length_days: null, // Backend hasn't set a default
  payments_enabled: false, // MVP: Always false until payments launch
  pricing_tiers: {
    artist_pro: { price_ore: 9900, active: false },     // 99 SEK
    artist_elite: { price_ore: 24900, active: false },  // 249 SEK
    fan_supporter: { price_ore: 5900, active: false },  // 59 SEK
    brand_pro: { price_ore: 99900, active: false },     // 999 SEK
  },
};

export const useAppConfig = () => {
  // TODO: Replace with actual API call when GET /config exists
  // const { data, isLoading, refetch } = useQuery(['app-config'], fetchAppConfig);
  
  const [isLoading] = useState(false);
  const [config] = useState<AppConfig>(MOCK_APP_CONFIG);

  const refetch = useCallback(() => {
    // TODO: Implement actual refetch when API exists
    return Promise.resolve();
  }, []);

  // Use the centralized payment check function
  // This ensures consistent behavior across the app
  const isPaymentsEnabled = checkPaymentsEnabled(config);

  return {
    config,
    isLoading,
    isPaymentsEnabled,
    refetch,
  };
};
