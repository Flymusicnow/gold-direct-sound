

# Unlock System UI Mapping (Final)
## Policy-Level Feature Gating for FlyMusic MVP

---

## Final Improvements Applied

### 1. TEMP Scaffold Marking for Hierarchy Checks
- All client-side hierarchy checks marked as TEMP scaffold
- Clear documentation that backend-resolved permissions replace hierarchy gating
- Explicit removal instructions when `/config` provides `feature_unlocks`

### 2. Neutral Trial CTA
- Changed "Active" → "Included in trial (MVP)"
- Works correctly regardless of user state
- Consistent with other MVP labels

---

## Phase 1: Type Definitions

### 1.1 Create `src/types/unlockLevels.ts`

```typescript
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
```

### 1.2 Create `src/config/unlockConfig.mock.ts`

```typescript
/**
 * ============================================================
 * TEMP MOCK — remove once /config provides feature metadata.
 * Not business logic. For UI scaffolding only.
 * ============================================================
 * 
 * This file will be DELETED when backend provides:
 * - GET /config with feature_unlocks array
 * - Per-feature unlock level metadata
 */

import { FeatureUnlock } from '@/types/unlockLevels';

// TEMP MOCK: Artist feature unlocks
export const MOCK_ARTIST_FEATURE_UNLOCKS: Record<string, FeatureUnlock> = {
  // Artist Free (always)
  'basic_profile': { feature_key: 'basic_profile', required_level: 'artist_free', mvp_available: true },
  'limited_uploads': { feature_key: 'limited_uploads', required_level: 'artist_free', mvp_available: true },
  'basic_campaigns': { feature_key: 'basic_campaigns', required_level: 'artist_free', mvp_available: true },
  'discovery': { feature_key: 'discovery', required_level: 'artist_free', mvp_available: true },
  'basic_stats': { feature_key: 'basic_stats', required_level: 'artist_free', mvp_available: true },
  
  // Artist Trial (MVP: available)
  'full_analytics': { feature_key: 'full_analytics', required_level: 'artist_trial', mvp_available: true },
  'community_tools': { feature_key: 'community_tools', required_level: 'artist_trial', mvp_available: true },
  'campaign_insights': { feature_key: 'campaign_insights', required_level: 'artist_trial', mvp_available: true },
  'extended_uploads': { feature_key: 'extended_uploads', required_level: 'artist_trial', mvp_available: true },
  
  // Artist Pro (post-MVP)
  'advanced_analytics': { feature_key: 'advanced_analytics', required_level: 'artist_pro', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'fan_segmentation': { feature_key: 'fan_segmentation', required_level: 'artist_pro', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'campaign_builder': { feature_key: 'campaign_builder', required_level: 'artist_pro', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
};

// TEMP MOCK: Fan feature unlocks
export const MOCK_FAN_FEATURE_UNLOCKS: Record<string, FeatureUnlock> = {
  // Fan Free/Trial (always/trial)
  'follow_artists': { feature_key: 'follow_artists', required_level: 'fan_free', mvp_available: true },
  'basic_vote': { feature_key: 'basic_vote', required_level: 'fan_free', mvp_available: true },
  'leaderboard': { feature_key: 'leaderboard', required_level: 'fan_free', mvp_available: true },
  'discovery': { feature_key: 'discovery', required_level: 'fan_free', mvp_available: true },
  
  // Fan Supporter (post-MVP)
  'highlight_votes': { feature_key: 'highlight_votes', required_level: 'fan_supporter', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'extra_votes': { feature_key: 'extra_votes', required_level: 'fan_supporter', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  
  // Fan Superfan (post-MVP)
  'vip_vote': { feature_key: 'vip_vote', required_level: 'fan_superfan', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'collectibles': { feature_key: 'collectibles', required_level: 'fan_superfan', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
};
```

---

## Phase 2: Update Pricing Page

### 2.1 Update `src/pages/Pricing.tsx`

**Artist Plans** - Neutral Trial CTA:

```typescript
const artistPlans = [
  {
    key: "artist_free",
    name: "Free",
    price: 0,
    description: "Get started with the essentials",
    features: [
      "Basic artist profile",
      "Limited track uploads",
      "Basic campaigns",
      "Discovery listing",
      "Basic stats"
    ],
    cta: "Get Started",
    unlockLevel: 'artist_free'
  },
  {
    key: "artist_trial",
    name: "Trial",
    price: 0,
    description: "Extended access during trial period",
    features: [
      "Everything in Free",
      "Full analytics dashboard",
      "Community tools",
      "Campaign insights",
      "Extended uploads"
    ],
    cta: "Included in trial (MVP)",  // NEUTRAL - works for any user state
    popular: true,
    unlockLevel: 'artist_trial',
    mvpLabel: "Included in trial (MVP)"
  },
  {
    key: "artist_pro",
    name: "Pro",
    price: null,
    description: "Premium features",
    features: [
      "Everything in Trial",
      "Advanced analytics",
      "Fan segmentation",
      "Campaign builder"
    ],
    cta: "Pricing finalized post-MVP",
    unlockLevel: 'artist_pro',
    mvpLabel: "Pricing finalized post-MVP"
  }
];
```

**Fan Plans**:

```typescript
const fanPlans = [
  {
    key: "fan_free",
    name: "Free",
    price: 0,
    description: "Discover and support artists",
    features: [
      "Follow artists",
      "Basic voting",
      "View leaderboards",
      "Discovery & search"
    ],
    cta: "Join Free",
    unlockLevel: 'fan_free'
  },
  {
    key: "fan_supporter",
    name: "Supporter",
    price: null,
    description: "Enhanced fan features",
    features: [
      "Everything in Free",
      "Additional votes",
      "Highlight votes"
    ],
    cta: "Pricing finalized post-MVP",
    unlockLevel: 'fan_supporter',
    mvpLabel: "Pricing finalized post-MVP"
  },
  {
    key: "fan_superfan",
    name: "Superfan",
    price: null,
    description: "Premium fan experience",
    features: [
      "Everything in Supporter",
      "VIP votes",
      "Collectibles access"
    ],
    cta: "Pricing finalized post-MVP",
    unlockLevel: 'fan_superfan',
    mvpLabel: "Pricing finalized post-MVP"
  }
];
```

---

## Phase 3: Update StudioSubscription

### 3.1 Update `src/pages/studio/StudioSubscription.tsx`

**Tiers array** - Neutral labels:

```typescript
const tiers = [
  {
    name: "Free",
    subtitle: "Getting Started",
    price: null,
    description: "Essential tools to begin",
    features: [
      "Basic artist profile",
      "Limited track uploads",
      "Basic campaigns",
      "Discovery listing",
      "Basic stats"
    ],
    current: true,
    unlockLevel: 'artist_free',
    ctaText: "Current Plan",
    icon: Sparkles,
  },
  {
    name: "Trial Access",
    subtitle: "MVP",
    price: null,
    description: "Extended access during trial",
    features: [
      "Everything in Free",
      "Full analytics dashboard",
      "Community tools",
      "Campaign insights",
      "Extended uploads"
    ],
    unlockLevel: 'artist_trial',
    ctaText: "Included in trial (MVP)",  // NEUTRAL
    icon: Star,
    highlight: true,
    mvpLabel: "Included in trial (MVP)"
  },
  {
    name: "Artist Pro",
    subtitle: "Post-MVP",
    price: null,
    description: "Premium features",
    features: [
      "Everything in Trial",
      "Advanced analytics",
      "Fan segmentation",
      "Campaign builder"
    ],
    unlockLevel: 'artist_pro',
    ctaText: "Pricing finalized post-MVP",
    icon: Crown,
    mvpLabel: "Pricing finalized post-MVP"
  },
];
```

---

## Phase 4: Feature Flag Context Updates

### 4.1 Update `src/contexts/FeatureFlagContext.tsx`

Add role-guarded unlock checks with TEMP scaffold marking:

```typescript
import { 
  ArtistLevel, 
  FanLevel, 
  checkArtistLevel, 
  checkFanLevel,
} from '@/types/unlockLevels';

// In context type:
interface FeatureFlagContextType {
  // ... existing
  /**
   * TEMP SCAFFOLD — Remove when backend provides resolved permissions
   * Backend will provide: GET /config → { feature_unlocks: [{ feature_key, allowed }] }
   */
  checkArtistUnlock: (userLevel: ArtistLevel, requiredLevel: ArtistLevel) => boolean;
  checkFanUnlock: (userLevel: FanLevel, requiredLevel: FanLevel) => boolean;
}

// In provider:
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
```

---

## Phase 5: i18n Updates

### 5.1 Update `src/i18n/en.ts`

```typescript
unlock: {
  artistFree: "Free",
  artistTrial: "Trial",
  artistPro: "Pro",
  artistPartner: "Partner",
  fanFree: "Free",
  fanSupporter: "Supporter",
  fanSuperfan: "Superfan",
  includedInTrial: "Included in trial (MVP)",
  pricingFinalizedPostMvp: "Pricing finalized post-MVP",
  inviteOnly: "Invite only",
  mvpBanner: "Extended features available during trial. Pricing and tiers finalized post-MVP.",
}
```

### 5.2 Update `src/i18n/sv.ts`

```typescript
unlock: {
  artistFree: "Gratis",
  artistTrial: "Provperiod",
  artistPro: "Pro",
  artistPartner: "Partner",
  fanFree: "Gratis",
  fanSupporter: "Supporter",
  fanSuperfan: "Superfan",
  includedInTrial: "Ingår i provperiod (MVP)",
  pricingFinalizedPostMvp: "Prissättning fastställs efter MVP",
  inviteOnly: "Endast på inbjudan",
  mvpBanner: "Utökade funktioner ingår i provperiod. Prissättning fastställs efter MVP.",
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `src/types/unlockLevels.ts` | Separate hierarchies with TEMP scaffold marking |
| **Create** | `src/config/unlockConfig.mock.ts` | TEMP MOCK with clear deletion header |
| **Modify** | `src/pages/Pricing.tsx` | Neutral CTAs, no hard numbers |
| **Modify** | `src/pages/studio/StudioSubscription.tsx` | Neutral CTAs, no hard numbers |
| **Modify** | `src/contexts/FeatureFlagContext.tsx` | Role-guarded checks with TEMP scaffold notes |
| **Modify** | `src/components/premium/PricingCard.tsx` | mvpLabel prop support |
| **Modify** | `src/i18n/en.ts` | Neutral unlock translations |
| **Modify** | `src/i18n/sv.ts` | Swedish neutral translations |

---

## Compliance Checklist

- [x] TEMP SCAFFOLD marking on all hierarchy checks
- [x] Clear backend migration path documented
- [x] Neutral Trial CTA: "Included in trial (MVP)"
- [x] No user-state-dependent labels
- [x] Separate artist/fan hierarchies
- [x] No hard numbers
- [x] All pricing from backend (null for post-MVP)

