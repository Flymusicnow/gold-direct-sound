/**
 * MVP Configuration - Bootstrap Fallback Only
 * 
 * Once AppConfig from GET /config exists, that becomes the single source of truth.
 * This file provides fallback values when the backend config is unavailable.
 */
export const MVP_CONFIG = {
  payments_enabled: false,
  mvp_payment_label: "Coming after MVP",
  trial_enabled: true,
  trial_length_days: null as number | null, // NO DEFAULT - must come from backend
  is_staging: true,
} as const;

/**
 * TEMP: Free plan keys until config-driven `is_free` field exists.
 * When /config provides plan metadata, this will be replaced.
 */
export const FREE_PLAN_KEYS = new Set([
  'artist_free',
  'fan_free',
  'brand_lite',
]) as ReadonlySet<string>;

/**
 * Check if a plan key is a free plan.
 * TEMP: Uses explicit Set until backend provides `is_free` flag per plan.
 */
export const isFreePlan = (planKey: string): boolean => {
  return FREE_PLAN_KEYS.has(planKey);
};

/**
 * Check if payments are enabled.
 * Uses AppConfig from backend when available, falls back to MVP_CONFIG.
 */
export const isPaymentsEnabled = (appConfig?: { payments_enabled: boolean } | null): boolean => {
  if (appConfig !== undefined && appConfig !== null) {
    return appConfig.payments_enabled; // Use backend config (single source of truth)
  }
  return MVP_CONFIG.payments_enabled; // Fallback for bootstrap
};

/**
 * Get the MVP payment disabled label
 */
export const getMvpPaymentLabel = (): string => MVP_CONFIG.mvp_payment_label;
