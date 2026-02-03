/**
 * Trial Status - returned by GET /trial/status endpoint
 * All values are backend-calculated. Frontend displays only, never calculates.
 */
export interface TrialStatus {
  trial_enabled: boolean;
  trial: {
    active: boolean;
    type: string | null;
    level_scope: number | null;
    started_at: string | null;
    ends_at: string | null;
    days_left: number | null;
    state: 'active' | 'expired' | 'converted' | 'none';
  };
}

/**
 * Legacy flat trial status for backward compatibility
 * @deprecated Use TrialStatus.trial object instead
 */
export interface LegacyTrialStatus {
  trial_enabled: boolean;
  trial_length_days: 7 | 14 | 30 | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days_left: number | null;
  trial_state: 'active' | 'expired' | 'none' | 'loading';
}

/**
 * App Configuration - returned by GET /config endpoint
 * Single source of truth when available, replaces MVP_CONFIG fallback.
 */
export interface AppConfig {
  mvp_mode: MvpModeConfig;
  payments_enabled: boolean;
  trial: {
    trial_enabled?: boolean;
    enabled?: boolean;
    allowed_lengths_days: number[];
    default_length_days: number;
  };
  limits: Record<string, number | null>;
  subscription_products: SubscriptionProduct[];
  feature_unlocks: FeatureUnlockConfig[];
}

export interface MvpModeConfig {
  enabled: boolean;
  grants: string[]; // ['artist_trial', 'fan_supporter']
}

export interface SubscriptionProduct {
  key: string;
  name: string;
  price_ore: number;
  billing_period: 'month' | 'year';
  features: string[];
  active: boolean;
}

/**
 * Feature unlock configuration from /config endpoint
 * V2 Canon: required_level is numeric (0, 10, 20, 30)
 */
export interface FeatureUnlockConfig {
  feature_key: string;
  required_level: number; // MUST be number (0, 10, 20, 30)
  user_type: string;
  mvp_available?: boolean;
}

// ============================================
// Price Utilities (öre to SEK conversion)
// ============================================

/**
 * Convert öre to SEK
 * @param ore - Amount in öre (e.g., 9900)
 * @returns Amount in SEK (e.g., 99)
 */
export const oreToSek = (ore: number): number => ore / 100;

/**
 * Format price from öre to display string
 * @param ore - Amount in öre (e.g., 9900)
 * @returns Formatted string (e.g., "99 SEK")
 */
export const formatPriceFromOre = (ore: number): string => `${oreToSek(ore)} SEK`;

// ============================================
// Default Values (neutral loading state)
// ============================================

/**
 * Default trial status used when API hasn't responded yet.
 * Shows neutral state with no numeric values.
 */
export const DEFAULT_TRIAL_STATUS: TrialStatus = {
  trial_enabled: true,
  trial: {
    active: false,
    type: null,
    level_scope: null,
    started_at: null,
    ends_at: null,
    days_left: null,
    state: 'none',
  },
};

/**
 * Fallback app config used when GET /config hasn't responded yet.
 */
export const FALLBACK_APP_CONFIG: AppConfig = {
  mvp_mode: { enabled: true, grants: ['artist_trial', 'fan_supporter'] },
  payments_enabled: false,
  trial: {
    trial_enabled: true,
    allowed_lengths_days: [7, 14, 30],
    default_length_days: 14,
  },
  limits: {},
  subscription_products: [],
  feature_unlocks: [],
};
