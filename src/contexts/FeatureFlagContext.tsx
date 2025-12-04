import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FeatureFlagKey = 
  | 'TRUST_LAYER_ENABLED'
  | 'SOCIAL_RITUALS_ENABLED'
  | 'REACH_ECONOMY_ENABLED'
  | 'LIVE_OS_V2_ENABLED';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
}

interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  isLoading: boolean;
  isEnabled: (key: FeatureFlagKey) => boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_key, is_enabled');

      if (error) throw error;

      const flagMap: Record<string, boolean> = {};
      data?.forEach((flag: { flag_key: string; is_enabled: boolean }) => {
        flagMap[flag.flag_key] = flag.is_enabled;
      });
      setFlags(flagMap);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const isEnabled = (key: FeatureFlagKey): boolean => {
    return flags[key] ?? false;
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, isEnabled, refetch: fetchFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};
