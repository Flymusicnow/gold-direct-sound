import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FeatureFlagKey = 
  | 'TRUST_LAYER_ENABLED'
  | 'SOCIAL_RITUALS_ENABLED'
  | 'REACH_ECONOMY_ENABLED'
  | 'LIVE_OS_V2_ENABLED'
  | 'CONTEXTUAL_REPORTING_ENABLED'
  | 'COMMUNITY_FEED'
  | 'SUBSCRIPTION_TIERS'
  | 'SPOTLIGHT_CAROUSEL'
  | 'ARTIST_GOALS'
  | 'REFERRALS_ENABLED';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  enabled_for_artists: string[];
  config: Record<string, unknown>;
  requires_legal_approval: boolean;
  requires_payment_setup: boolean;
}

interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  fullFlags: Record<string, FeatureFlag>;
  isLoading: boolean;
  isEnabled: (key: FeatureFlagKey) => boolean;
  isEnabledForArtist: (key: FeatureFlagKey, artistId: string) => boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [fullFlags, setFullFlags] = useState<Record<string, FeatureFlag>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;

      const flagMap: Record<string, boolean> = {};
      const fullFlagMap: Record<string, FeatureFlag> = {};
      
      data?.forEach((flag: any) => {
        flagMap[flag.flag_key] = flag.is_enabled;
        fullFlagMap[flag.flag_key] = {
          id: flag.id,
          flag_key: flag.flag_key,
          flag_name: flag.flag_name,
          description: flag.description,
          is_enabled: flag.is_enabled,
          enabled_for_artists: flag.enabled_for_artists ?? [],
          config: flag.config ?? {},
          requires_legal_approval: flag.requires_legal_approval ?? false,
          requires_payment_setup: flag.requires_payment_setup ?? false
        };
      });
      
      setFlags(flagMap);
      setFullFlags(fullFlagMap);
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

  const isEnabledForArtist = (key: FeatureFlagKey, artistId: string): boolean => {
    const flag = fullFlags[key];
    if (!flag) return false;
    
    // If globally enabled, allow for all
    if (flag.is_enabled) return true;
    
    // Check artist-specific allowlist
    return flag.enabled_for_artists?.includes(artistId) ?? false;
  };

  return (
    <FeatureFlagContext.Provider value={{ 
      flags, 
      fullFlags, 
      isLoading, 
      isEnabled, 
      isEnabledForArtist, 
      refetch: fetchFlags,
    }}>
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
