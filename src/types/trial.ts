/**
 * Trial Status - returned by GET /trial/status endpoint
 * All values are backend-calculated. Frontend displays only, never calculates.
 */
export interface TrialStatus {
  trial_enabled: boolean;
  trial_length_days: 7 | 14 | 30 | null; // null if not configured
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days_left: number | null; // Backend-calculated ONLY, null if unknown
  trial_state: 'active' | 'expired' | 'none' | 'loading'; // Backend-determined ONLY
}

/**
 * App Configuration - returned by GET /config endpoint
 * Single source of truth when available, replaces MVP_CONFIG fallback.
 */
export interface AppConfig {
  mvp_mode: boolean;
  payments_enabled: boolean;
  trial: {
    trial_enabled: boolean;
    allowed_lengths_days: number[];
    default_length_days: number;
  };
  limits: Record<string, number | null>;
  subscription_products: SubscriptionProduct[];
  feature_unlocks: FeatureUnlockConfig[];
}

export interface SubscriptionProduct {
  key: string;
  name: string;
  price_ore: number;
  billing_period: 'month' | 'year';
  features: string[];
  active: boolean;
}

export interface FeatureUnlockConfig {
  feature_key: string;
  required_level: string;
  mvp_available: boolean;
  post_mvp_label?: string;
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
 * Shows neutral "loading" state with no numeric values.
 */
export const DEFAULT_TRIAL_STATUS: TrialStatus = {
  trial_enabled: true,
  trial_length_days: null,
  trial_started_at: null,
  trial_ends_at: null,
  trial_days_left: null,
  trial_state: 'loading',
};

/**
 * Fallback app config used when GET /config hasn't responded yet.
 */
export const FALLBACK_APP_CONFIG: AppConfig = {
  mvp_mode: true,
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
