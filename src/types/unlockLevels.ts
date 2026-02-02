/**
 * Unlock Level Types - Policy-driven feature gating
 * 
 * During MVP: Features available via trial
 * Post-MVP: Backend /config determines actual gating
 * 
 * ============================================================
 * TEMP SCAFFOLD — Client-side hierarchy checks
 * 
 * Once backend provides per-feature permissions via /config 
 * (feature_unlocks array with resolved permissions), the UI 
 * must rely on backend-resolved permissions and we remove 
 * all hierarchy-based gating from this file.
 * 
 * Backend will provide:
 * - GET /config → { feature_unlocks: [{ feature_key, allowed: boolean }] }
 * - Per-user resolved permissions, NOT level comparisons
 * ============================================================
 */

// Artist levels - separate hierarchy
export type ArtistLevel = 
  | 'artist_free'      // Always available
  | 'artist_trial'     // During trial period
  | 'artist_pro'       // Post-MVP paid
  | 'artist_partner';  // Invite-only

// Fan levels - separate hierarchy  
export type FanLevel = 
  | 'fan_free'         // Always available
  | 'fan_trial'        // During trial period
  | 'fan_supporter'    // Post-MVP
  | 'fan_superfan';    // Post-MVP

export type UnlockLevel = ArtistLevel | FanLevel;

export interface FeatureUnlock {
  feature_key: string;
  required_level: UnlockLevel;
  mvp_available: boolean;
  post_mvp_label?: string;
}

/**
 * TEMP SCAFFOLD — Separate hierarchies for client-side checks
 * Remove when backend provides resolved permissions
 */
export const ARTIST_LEVEL_HIERARCHY: Record<ArtistLevel, number> = {
  'artist_free': 0,
  'artist_trial': 1,
  'artist_pro': 2,
  'artist_partner': 3,
};

export const FAN_LEVEL_HIERARCHY: Record<FanLevel, number> = {
  'fan_free': 0,
  'fan_trial': 1,
  'fan_supporter': 2,
  'fan_superfan': 3,
};

/**
 * TEMP SCAFFOLD — Role-guarded level checks
 * Remove when backend provides resolved permissions via /config
 */
export const checkArtistLevel = (
  userLevel: ArtistLevel, 
  requiredLevel: ArtistLevel
): boolean => {
  return ARTIST_LEVEL_HIERARCHY[userLevel] >= ARTIST_LEVEL_HIERARCHY[requiredLevel];
};

export const checkFanLevel = (
  userLevel: FanLevel, 
  requiredLevel: FanLevel
): boolean => {
  return FAN_LEVEL_HIERARCHY[userLevel] >= FAN_LEVEL_HIERARCHY[requiredLevel];
};

export const isArtistLevel = (level: UnlockLevel): level is ArtistLevel => {
  return level.startsWith('artist_');
};

export const isFanLevel = (level: UnlockLevel): level is FanLevel => {
  return level.startsWith('fan_');
};
