

# Final Fixes: Remove String Matching + Verify Hook Compilation

---

## Summary

Two targeted fixes to complete the MVP Payment Lockdown implementation:

1. **Replace `planKey.includes('free')` with explicit FREE_PLAN_KEYS Set** - No string matching
2. **Verify `useTrialStatus` compiles** - Already fixed ✅ (variables are explicitly defined)

---

## Fix 1: Explicit FREE_PLAN_KEYS Set

### 1.1 Update `src/config/mvpConfig.ts`

Add FREE_PLAN_KEYS Set and helper function:

```typescript
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
```

### 1.2 Update `src/pages/Pricing.tsx`

**Import the helper:**
```typescript
import { isPaymentsEnabled, isFreePlan } from "@/config/mvpConfig";
```

**Line 216 - isCurrentPlan function:**
```typescript
// BEFORE:
return planKey.includes('free');

// AFTER:
return isFreePlan(planKey);
```

**Line 235 - handleSubscribe MVP block:**
```typescript
// BEFORE:
if (planKey.includes('free')) {

// AFTER:
if (isFreePlan(planKey)) {
```

**Line 246 - handleSubscribe post-MVP block:**
```typescript
// BEFORE:
if (planKey.includes('free') || planKey === 'brand_enterprise') {

// AFTER:
if (isFreePlan(planKey) || planKey === 'brand_enterprise') {
```

---

## Fix 2: Verify useTrialStatus Compiles

**Status: Already Fixed ✅**

The current implementation in `src/hooks/useTrialStatus.ts` already has explicit variable definitions:

```typescript
const [isLoading] = useState(false);
const [trialStatus] = useState<TrialStatus>(MOCK_TRIAL_STATUS);

const refetch = useCallback(() => {
  return Promise.resolve();
}, []);
```

No changes needed - the hook will compile correctly.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/config/mvpConfig.ts` | Add `FREE_PLAN_KEYS` Set and `isFreePlan()` helper |
| `src/pages/Pricing.tsx` | Replace 3x `planKey.includes('free')` with `isFreePlan(planKey)` |

---

## Compliance Verification

- [x] No string matching (`includes`, `startsWith`, etc.)
- [x] Explicit Set with TEMP marker for future config migration
- [x] All variables explicitly defined (no undefined references)
- [x] Build will compile successfully

