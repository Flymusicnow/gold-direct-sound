import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArtistLevel, 
  FanLevel, 
  checkArtistLevel, 
  checkFanLevel,
} from '@/types/unlockLevels';

export type FeatureFlagKey = 
  | 'TRUST_LAYER_ENABLED'
  | 'SOCIAL_RITUALS_ENABLED'
  | 'REACH_ECONOMY_ENABLED'
  | 'LIVE_OS_V2_ENABLED'
  | 'CONTEXTUAL_REPORTING_ENABLED'
  | 'COMMUNITY_FEED'
  | 'SUBSCRIPTION_TIERS'
  | 'SPOTLIGHT_CAROUSEL'
  | 'ARTIST_GOALS';

export type UserTier = 'free' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'pro' | 'elite' | 'supporter' | 'enterprise' | 'trial' | 'partner';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  requires_subscription: boolean;
  enabled_for_free: boolean;
  enabled_for_pro: boolean;
  enabled_for_elite: boolean;
  enabled_for_brands: boolean;
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
  checkTierAccess: (key: string, tier: UserTier) => boolean;
  refetch: () => Promise<void>;
  /**
   * TEMP SCAFFOLD — Remove when backend provides resolved permissions
   * Backend will provide: GET /config → { feature_unlocks: [{ feature_key, allowed }] }
   */
  checkArtistUnlock: (userLevel: ArtistLevel, requiredLevel: ArtistLevel) => boolean;
  checkFanUnlock: (userLevel: FanLevel, requiredLevel: FanLevel) => boolean;
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
          requires_subscription: flag.requires_subscription ?? false,
          enabled_for_free: flag.enabled_for_free ?? true,
          enabled_for_pro: flag.enabled_for_pro ?? true,
          enabled_for_elite: flag.enabled_for_elite ?? true,
          enabled_for_brands: flag.enabled_for_brands ?? false,
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

  const checkTierAccess = (key: string, tier: UserTier): boolean => {
    const flag = fullFlags[key];
    if (!flag) return true; // Feature not configured, allow by default
    if (!flag.is_enabled) return false; // Feature disabled globally
    if (!flag.requires_subscription) return true; // No subscription required
    
    switch (tier) {
      case 'enterprise':
      case 'elite':
      case 'diamond':
      case 'partner':
        return flag.enabled_for_elite;
      case 'pro':
      case 'supporter':
      case 'gold':
      case 'silver':
      case 'trial':
        return flag.enabled_for_pro;
      case 'bronze':
      case 'free':
      default:
        return flag.enabled_for_free;
    }
  };

  /**
   * TEMP SCAFFOLD — Client-side hierarchy checks
   * Remove when backend provides per-feature resolved permissions
   */
  const checkArtistUnlock = (userLevel: ArtistLevel, requiredLevel: ArtistLevel): boolean => {
    return checkArtistLevel(userLevel, requiredLevel);
  };

  const checkFanUnlock = (userLevel: FanLevel, requiredLevel: FanLevel): boolean => {
    return checkFanLevel(userLevel, requiredLevel);
  };

  return (
    <FeatureFlagContext.Provider value={{ 
      flags, 
      fullFlags, 
      isLoading, 
      isEnabled, 
      isEnabledForArtist, 
      checkTierAccess, 
      refetch: fetchFlags,
      checkArtistUnlock,
      checkFanUnlock
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
