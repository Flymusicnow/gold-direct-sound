

# V2 Canon Final Blockers — Fix Plan

## Overview

Two remaining violations prevent V2 canon compliance. Both involve client-side logic/copy that conflicts with the backend-as-source-of-truth model.

---

## Blocker 1: Remove Client-Side Tier Logic from FeatureFlagContext

### Problem

`FeatureFlagContext.tsx` contains `checkTierAccess` (lines 110-133) which implements client-side tier reasoning with a switch statement. V2 canon requires **zero client-side tier logic** — all entitlements must come from `/me.permissions` only.

### Changes

**File: `src/contexts/FeatureFlagContext.tsx`**

| Action | Lines | What |
|--------|-------|------|
| **REMOVE** | 15 | `UserTier` type export |
| **REMOVE** | 23-31 | Tier-related fields from `FeatureFlag` interface (`requires_subscription`, `enabled_for_free`, `enabled_for_pro`, `enabled_for_elite`, `enabled_for_brands`) |
| **REMOVE** | 40 | `checkTierAccess` from context type |
| **REMOVE** | 70-78 | Tier field mapping in `fetchFlags` |
| **REMOVE** | 110-133 | Entire `checkTierAccess` function |
| **REMOVE** | 142 | `checkTierAccess` from provider value |

**Simplified FeatureFlag interface (KEEP):**
```typescript
interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  enabled_for_artists: string[];  // Artist allowlist - KEEP
  config: Record<string, unknown>;
  requires_legal_approval: boolean;
  requires_payment_setup: boolean;
}
```

**Simplified context type (KEEP):**
```typescript
interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  fullFlags: Record<string, FeatureFlag>;
  isLoading: boolean;
  isEnabled: (key: FeatureFlagKey) => boolean;
  isEnabledForArtist: (key: FeatureFlagKey, artistId: string) => boolean;
  refetch: () => Promise<void>;
}
```

### Rationale

- Feature flags serve **global on/off** control for platform features
- Artist allowlist enables **gradual rollout** (e.g., beta testers)
- **Entitlement checks** (who can access what tier) come from `/me.permissions`
- No overlap, no confusion, single source of truth

---

## Blocker 2: Fix TrialBanner Copy for Scoped Trials

### Problem

Line 95 states: `"All premium features are unlocked during your trial period."`

This is **factually incorrect** under V2 canon:
- MVP mode grants only `artist_trial` (10) and `fan_supporter` (20)
- Elite/Superfan features (30) remain **locked**
- Trials are scope-aware (`level_scope` caps access)

### Changes

**File: `src/components/trial/TrialBanner.tsx`**

| Line | Current | New |
|------|---------|-----|
| 91 | `Available during trial` | `Trial access` |
| 95 | `All premium features are unlocked during your trial period.` | `Explore select features included in your trial.` |

### Copy Alternatives (if preferred)

**Option A (neutral):** `"Explore select features included in your trial."`

**Option B (action-oriented):** `"Try out features included in your trial. Upgrade anytime for full access."`

**Option C (minimal):** `"Some features are available during your trial period."`

---

## Files Summary

| File | Action |
|------|--------|
| `src/contexts/FeatureFlagContext.tsx` | Remove `UserTier`, `checkTierAccess`, tier-related fields |
| `src/components/trial/TrialBanner.tsx` | Update copy to reflect scoped access |

---

## Verification After Fix

| Check | Expected |
|-------|----------|
| `checkTierAccess` in codebase | **Not found** |
| `UserTier` type export | **Not found** |
| TrialBanner copy | No claim of "all" features |
| Feature flags | Only global on/off + artist allowlist |
| Entitlements | Come from `/me.permissions` only |

---

## V2 Canon Compliance After Fix

With these two changes:
- **Zero client-side tier reasoning** ✓
- **Backend is single source of truth** ✓
- **Copy reflects actual product behavior** ✓
- **V2 Canon complete** ✓

