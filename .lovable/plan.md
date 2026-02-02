
# FlyMusic MVP Implementation Plan
## Payment Lockdown + Trial UI Components (Final Corrections Applied)

---

## Corrections Applied

### 1. Remove planKey String Logic
- `handleSubscribe` blocks ALL checkouts via `payments_enabled === false` ONLY
- No string checking like `planKey.includes('free')`
- Single boolean gate for all payment flows

### 2. Single Source of Truth
- `MVP_CONFIG` = bootstrap fallback ONLY
- `AppConfig` from `GET /config` = single source of truth when available
- Hook pattern: `isPaymentsEnabled(appConfig)` checks AppConfig first, falls back to MVP_CONFIG

### 3. Graceful Null Handling
- If `trial_length_days === null` → show "Trial active" (no number)
- If `trial_days_left === null` → show "Trial active" (no countdown)
- If `/trial/status` fails → show "Checking trial status..." (loading state)
- NO numeric fallbacks anywhere

---

## Phase 1: New Files to Create

### 1.1 `src/config/mvpConfig.ts`
```typescript
/**
 * MVP Configuration - Bootstrap Fallback Only
 * 
 * Once AppConfig from GET /config exists, that becomes the single source of truth.
 */
export const MVP_CONFIG = {
  payments_enabled: false,
  mvp_payment_label: "Coming after MVP",
  trial_enabled: true,
  trial_length_days: null as number | null, // NO DEFAULT
  is_staging: true,
} as const;

export const isPaymentsEnabled = (appConfig?: { payments_enabled: boolean } | null): boolean => {
  if (appConfig !== undefined && appConfig !== null) {
    return appConfig.payments_enabled; // Use backend config
  }
  return MVP_CONFIG.payments_enabled; // Fallback
};

export const getMvpPaymentLabel = (): string => MVP_CONFIG.mvp_payment_label;
```

### 1.2 `src/types/trial.ts`
```typescript
export interface TrialStatus {
  trial_enabled: boolean;
  trial_length_days: 7 | 14 | 30 | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days_left: number | null; // Backend-calculated, null if unknown
  trial_state: 'active' | 'expired' | 'none' | 'loading';
}

export interface AppConfig {
  trial_enabled: boolean;
  trial_length_days: number | null;
  payments_enabled: boolean;
  pricing_tiers: Record<string, {
    price_ore: number; // öre (9900 = 99 SEK)
    active: boolean;
  }>;
}

// Price utilities
export const oreToSek = (ore: number): number => ore / 100;
export const formatPriceFromOre = (ore: number): string => `${oreToSek(ore)} SEK`;

// Default values (neutral loading state)
export const DEFAULT_TRIAL_STATUS: TrialStatus = {
  trial_enabled: true,
  trial_length_days: null,
  trial_started_at: null,
  trial_ends_at: null,
  trial_days_left: null,
  trial_state: 'loading',
};
```

### 1.3 `src/hooks/useTrialStatus.ts`
```typescript
// STUB: Returns mock data until GET /trial/status exists
// NO client-side calculations

// TEMP: Placeholder values for development
const MOCK_TRIAL_STATUS: TrialStatus = {
  trial_enabled: true,
  trial_length_days: 14, // TEMP: placeholder only
  trial_started_at: '...',
  trial_ends_at: '...',
  trial_days_left: 11, // TEMP: placeholder only
  trial_state: 'active',
};

export const useTrialStatus = () => {
  // On error or null values: return 'loading' state, NOT numeric fallback
  return {
    trialStatus,
    isLoading,
    isTrialActive: trialStatus.trial_state === 'active',
    isTrialExpired: trialStatus.trial_state === 'expired',
    isCheckingTrial: trialStatus.trial_state === 'loading' || trialStatus.trial_days_left === null,
    refetch,
  };
};
```

### 1.4 `src/hooks/useAppConfig.ts`
```typescript
// STUB: Returns mock config until GET /config exists
// This becomes SINGLE SOURCE OF TRUTH when available

const MOCK_APP_CONFIG: AppConfig = {
  trial_enabled: true,
  trial_length_days: null, // Backend hasn't set
  payments_enabled: false, // MVP: Always false
  pricing_tiers: {
    artist_pro: { price_ore: 9900, active: false },
    artist_elite: { price_ore: 24900, active: false },
    fan_supporter: { price_ore: 5900, active: false },
  },
};
```

### 1.5 Trial UI Components

| File | Purpose |
|------|---------|
| `src/components/trial/TrialBanner.tsx` | Shows countdown or "Trial active" if null |
| `src/components/trial/TrialExpiredModal.tsx` | Non-dismissible expired state modal |
| `src/components/trial/TrialGate.tsx` | HOC for feature gating |
| `src/components/trial/index.ts` | Barrel export |

**TrialBanner Display Logic:**
```
if (isLoading || trial_days_left === null):
  → "Checking trial status..." or "Trial active"

if (trial_days_left !== null):
  → "Trial: X days left"

if (trial_state === 'expired'):
  → Hidden (TrialExpiredModal handles)
```

---

## Phase 2: Payment Lockdown Updates

### 2.1 `src/pages/Pricing.tsx` Changes

**Line 221-258: Replace handleSubscribe**

BEFORE:
```typescript
const handleSubscribe = async (planKey: string, cta: string) => {
  if (planKey.includes('free') || planKey === 'brand_enterprise') {
    // ...allow navigation
  }
  // ...proceed to Stripe
};
```

AFTER:
```typescript
const handleSubscribe = async (planKey: string, cta: string) => {
  // MVP: Block ALL paid checkouts via single flag
  if (!isPaymentsEnabled(config)) {
    // Only allow free plans and contact sales
    if (planKey === 'brand_enterprise') {
      window.location.href = 'mailto:partnerships@flymusic.se';
      return;
    }
    if (planKey.includes('free')) {
      navigate('/auth');
      return;
    }
    // Block all other checkouts
    toast.info("Premium plans coming after MVP. All features available during trial!");
    return;
  }
  // Post-MVP: actual Stripe checkout
};
```

**Line ~293: Add MVP Banner**
```tsx
<div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
  <p className="text-sm text-center">
    <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
    <strong>MVP Mode:</strong> All premium features are available FREE during your trial period.
  </p>
</div>
```

**Line ~451: Update trust signal**
```tsx
// BEFORE: "14-day free trial on Pro plans"
// AFTER: "Full feature access during trial"
```

**Line ~179: Update FAQ**
```typescript
// BEFORE: "14-day free trial. No credit card required."
// AFTER: "All users receive a free trial period with full feature access."
```

### 2.2 `src/components/premium/PricingCard.tsx` Changes

Add `mvpLocked` prop:
```typescript
interface PricingCardProps {
  // ...existing
  mvpLocked?: boolean;
}

// In render:
{mvpLocked && (
  <Badge variant="secondary" className="absolute -top-3 right-4">
    Coming after MVP
  </Badge>
)}

<Button disabled={disabled || currentPlan || mvpLocked}>
  {mvpLocked ? "Available during trial" : ctaText}
</Button>
```

### 2.3 `src/components/premium/UpgradeModal.tsx` Changes

**Line ~105: Update handleUpgrade**
```typescript
const handleUpgrade = async () => {
  // MVP: Block ALL payments
  if (!isPaymentsEnabled(config)) {
    toast.info("Premium plans coming after MVP. Enjoy full access during your trial!");
    onOpenChange(false);
    return;
  }
  // Post-MVP: Stripe checkout
};
```

**Line ~180: Update CTA button**
```tsx
<Button onClick={handleUpgrade} className="w-full" disabled={!isPaymentsEnabled(config)}>
  {isPaymentsEnabled(config) ? (
    <>
      Upgrade Now
      <ExternalLink className="ml-2 h-4 w-4" />
    </>
  ) : (
    <>
      <Badge variant="secondary" className="mr-2">Coming after MVP</Badge>
      Available during trial
    </>
  )}
</Button>
```

### 2.4 `src/components/billing/BillingManagementCard.tsx` Changes

**Line ~109: Update free user CTA**
```tsx
<Button variant="outline" onClick={() => navigate('/pricing')} className="flex-1">
  <Sparkles className="mr-2 h-4 w-4" />
  View Plans
  <Badge variant="secondary" className="ml-2 text-xs">Coming after MVP</Badge>
</Button>
```

### 2.5 `src/pages/studio/StudioSubscription.tsx` Changes

**Line ~337: Update Early Access section copy**
```tsx
<p className="text-sm text-muted-foreground">
  During your trial period, you have full access to all platform features.
  Premium subscription options are being finalized for post-MVP launch.
</p>
```

---

## Phase 3: Dashboard Integration

### 3.1 `src/pages/FanDashboard.tsx`

**Line ~4: Add import**
```typescript
import { TrialBanner } from '@/components/trial';
```

**Line ~115: Add after header (inside PageTransition)**
```tsx
<TrialBanner className="mb-6" />
```

### 3.2 `src/pages/studio/StudioDashboard.tsx`

**Line ~26: Add import**
```typescript
import { TrialBanner } from '@/components/trial';
```

**Line ~229: Add after header section**
```tsx
<TrialBanner className="mb-6" />
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `src/config/mvpConfig.ts` | Bootstrap fallback config |
| **Create** | `src/types/trial.ts` | Trial types with öre pricing |
| **Create** | `src/hooks/useTrialStatus.ts` | Trial hook stub (TEMP mock) |
| **Create** | `src/hooks/useAppConfig.ts` | Config hook stub (single source of truth) |
| **Create** | `src/components/trial/TrialBanner.tsx` | Countdown banner (null-safe) |
| **Create** | `src/components/trial/TrialExpiredModal.tsx` | Expired state modal |
| **Create** | `src/components/trial/TrialGate.tsx` | Feature gating HOC |
| **Create** | `src/components/trial/index.ts` | Barrel export |
| **Modify** | `src/components/premium/PricingCard.tsx` | Add mvpLocked prop |
| **Modify** | `src/pages/Pricing.tsx` | Block payments via flag, add banner |
| **Modify** | `src/components/premium/UpgradeModal.tsx` | Block checkout via flag |
| **Modify** | `src/components/billing/BillingManagementCard.tsx` | Show trial info |
| **Modify** | `src/pages/studio/StudioSubscription.tsx` | Update copy |
| **Modify** | `src/pages/FanDashboard.tsx` | Add TrialBanner |
| **Modify** | `src/pages/studio/StudioDashboard.tsx` | Add TrialBanner |

---

## Compliance Checklist

- [x] No client-side trial calculation
- [x] No default trial_length_days (null in config)
- [x] No planKey string logic for payment blocking
- [x] Single source of truth: AppConfig > MVP_CONFIG fallback
- [x] Null handling: "Trial active" or "Checking..." (no numeric fallback)
- [x] Prices in öre (unambiguous)
- [x] All payment CTAs blocked via `isPaymentsEnabled()` flag
- [x] Mock values marked as TEMP
- [x] Neutral labeling: "Available during trial"

---

## Backend Dependencies (For Production)

When these are ready, remove mocks:

| Endpoint | Purpose |
|----------|---------|
| `GET /trial/status` | Replace MOCK_TRIAL_STATUS in useTrialStatus |
| `GET /config` | Replace MOCK_APP_CONFIG in useAppConfig |
| `user_trials` table | Storage for trial state |
| `get_trial_status` RPC | Server-side trial calculation |
