/**
 * Unlock Level Types - Policy-driven feature gating
 * 
 * During MVP: Features available via trial
 * Post-MVP: Backend /config determines actual gating
 * 
 * V2 Canon: Backend is single source of truth.
 * Frontend uses ONLY hasPermission(feature_key) from /me response.
 */

// Artist levels - separate hierarchy
export type ArtistLevel = 
  | 'artist_free'      // Level 0 - Always available
  | 'artist_trial'     // Level 10 - During trial period
  | 'artist_pro'       // Level 20 - Post-MVP paid
  | 'artist_partner';  // Level 30 - Invite-only (renamed from elite for clarity)

// Fan levels - separate hierarchy  
export type FanLevel = 
  | 'fan_free'         // Level 0 - Always available
  | 'fan_trial'        // Level 10 - During trial period
  | 'fan_supporter'    // Level 20 - Post-MVP
  | 'fan_superfan';    // Level 30 - Post-MVP

export type UnlockLevel = ArtistLevel | FanLevel;

export interface FeatureUnlock {
  feature_key: string;
  required_level: UnlockLevel;
  mvp_available: boolean;
  post_mvp_label?: string;
}

// Type guards for role-based checks
export const isArtistLevel = (level: UnlockLevel): level is ArtistLevel => {
  return level.startsWith('artist_');
};

export const isFanLevel = (level: UnlockLevel): level is FanLevel => {
  return level.startsWith('fan_');
};
