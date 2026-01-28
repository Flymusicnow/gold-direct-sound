

## Fix Plan: Build Errors + Goals Module Canonical Compliance

### Problem Summary

The build has two categories of issues:
1. **Goals-specific TypeScript errors** - Fixable immediately
2. **Pre-existing framer-motion/supabase type errors** - Dependency mismatch (not caused by Goals module)

Additionally, the Goals module needs adjustments to comply with FlyMusic economy canon and Wave-based feature gating.

---

### PHASE 1: Fix Goals-Specific TypeScript Errors

**File: `src/hooks/useActiveGoal.ts`**

Line 83 uses `Record<string, unknown>` which causes type issues with Supabase update:

```typescript
// CURRENT (line 83)
const updateData: Record<string, unknown> = {

// FIX
const updateData: Record<string, string | number> = {
```

This is more type-safe and compatible with Supabase's update method.

**File: `src/hooks/useArtistGoals.ts`**

The interface already correctly defines `refetch: () => Promise<void>` on line 42, and the implementation on line 219 correctly returns `fetchGoals` which is typed as `async () => {...}`. No change needed here.

**File: `src/hooks/useActiveGoal.ts`**

The interface on line 10 already correctly defines `refetch: () => Promise<void>`. No change needed here either.

The main TypeScript error was the `Record<string, unknown>` type on line 83.

---

### PHASE 2: Economy Canon Compliance

**Problem**: The donation modal currently says "FlyCoins will be deducted from your balance" - this violates FlyMusic economy rules where FlyCoin is an internal artist accounting unit, NOT fan currency.

**File: `src/components/artist/GoalDonationModal.tsx`**

Changes needed:

1. **Remove misleading copy (line 149-151)**:
```typescript
// CURRENT
<p className="text-xs text-muted-foreground">
  {t('goals.economyNote') || 'FlyCoins will be deducted from your balance'}
</p>

// FIX - Neutral beta messaging
<p className="text-xs text-muted-foreground">
  {t('goals.betaNote') || 'Support is tracked and shown on the goal progress'}
</p>
<p className="text-xs text-amber-500/80 mt-1">
  {t('goals.simulatedBeta') || '⚠️ Simulated in beta mode'}
</p>
```

2. **Remove "FlyCoins remaining" copy (line 127-131)**:
```typescript
// CURRENT
{remaining > 0 
  ? `${remaining.toLocaleString()} ${t('goals.flyCoinsRemaining') || 'FlyCoins remaining'}`
  : t('goals.goalComplete') || 'Goal complete!'}

// FIX - Neutral progress language
{remaining > 0 
  ? `${remaining.toLocaleString()} ${t('goals.remaining') || 'remaining to goal'}`
  : t('goals.goalComplete') || 'Goal complete!'}
```

3. **Update dialog description**:
Change "Amount to Contribute" label to neutral language that doesn't imply fan FlyCoin balance.

**File: `src/components/artist/ArtistGoalCard.tsx`**

Change "FlyCoins" display to use neutral "support points" or similar non-currency terminology:

```typescript
// Line 79 - CURRENT
{goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} {t('goals.flyCoins') || 'FlyCoins'}

// FIX - Use neutral terminology
{goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} {t('goals.supportPoints') || 'points'}
```

---

### PHASE 3: Feature Flag Gating

**Add new feature flag key**:

**File: `src/contexts/FeatureFlagContext.tsx`**

Add `ARTIST_GOALS` to the FeatureFlagKey type (line 4-12):

```typescript
export type FeatureFlagKey = 
  | 'TRUST_LAYER_ENABLED'
  | 'SOCIAL_RITUALS_ENABLED'
  | 'REACH_ECONOMY_ENABLED'
  | 'LIVE_OS_V2_ENABLED'
  | 'CONTEXTUAL_REPORTING_ENABLED'
  | 'COMMUNITY_FEED'
  | 'SUBSCRIPTION_TIERS'
  | 'SPOTLIGHT_CAROUSEL'
  | 'ARTIST_GOALS';  // ADD THIS
```

**File: `src/pages/studio/StudioGoals.tsx`**

Add feature flag check at the top of the component:

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function StudioGoals() {
  const { t } = useLanguage();
  const isGoalsEnabled = useFeatureFlag('ARTIST_GOALS');
  const { goals, loading, activeGoal } = useArtistGoals();
  // ...

  // Gate the feature
  if (!isGoalsEnabled) {
    return (
      <StudioLayout>
        <div className="p-6 text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Goals Coming Soon</h2>
          <p className="text-muted-foreground">This feature is not yet available.</p>
        </div>
      </StudioLayout>
    );
  }
  // ... rest of component
```

**File: `src/components/artist/ArtistGoalCard.tsx`**

Add feature flag check:

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function ArtistGoalCard({ artistId, className }: ArtistGoalCardProps) {
  const isGoalsEnabled = useFeatureFlag('ARTIST_GOALS');
  const { goal, loading } = useActiveGoal(artistId);
  const { t } = useLanguage();
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Don't render if feature is disabled, no active goal, or still loading
  if (!isGoalsEnabled || loading || !goal) {
    return null;
  }
  // ... rest of component
```

**File: `src/config/navigation.ts`**

Conditionally show Goals nav item based on feature flag (this would require refactoring nav config to support feature flags, but for MVP, the route protection above is sufficient).

---

### PHASE 4: i18n Translations

**File: `src/i18n/en.ts`**

Add goals section (insert after community section around line 1535):

```typescript
goals: {
  studioTitle: 'Goals',
  studioSubtitle: 'Create funding goals for your fans to support',
  createGoal: 'Create Goal',
  editGoal: 'Edit Goal',
  deleteGoal: 'Delete Goal',
  activeGoal: 'Active Goal',
  noGoalsTitle: 'No goals yet',
  noGoalsDescription: 'Create a goal to let your fans help you achieve your dreams. Set your own target amount—no presets or limits.',
  createFirstGoal: 'Create Your First Goal',
  goalTitle: 'Goal Title',
  goalTitlePlaceholder: 'e.g., New Album Production',
  goalDescription: 'Description',
  goalDescriptionPlaceholder: 'Tell your fans what this goal is about...',
  targetAmount: 'Target Amount',
  targetAmountPlaceholder: 'e.g., 5000',
  helpMeReach: 'Help Me Reach Goal',
  donate: 'Support',
  donating: 'Supporting...',
  supportGoal: 'Support This Goal',
  progress: 'Progress',
  remaining: 'remaining to goal',
  goalComplete: 'Goal complete!',
  fanSupported: 'fan supported',
  fansSupported: 'fans supported',
  goalReached: 'Goal Reached! Thank you for your support!',
  thankYou: 'Thank You!',
  supportMessage: 'Your support means the world to this artist!',
  donationSuccess: 'Thank you for your support!',
  donationFailed: 'Support failed. Please try again.',
  invalidAmount: 'Please enter a valid amount',
  signInRequired: 'Please sign in to support',
  amountToContribute: 'Support Amount',
  betaNote: 'Support is tracked and shown on the goal progress',
  simulatedBeta: 'Simulated in beta mode',
  supportPoints: 'points',
  flyCoins: 'support',
  activate: 'Activate',
  pause: 'Pause',
  complete: 'Mark Complete',
  draft: 'Draft',
  paused: 'Paused',
  completed: 'Completed',
  active: 'Active',
  createSuccess: 'Goal created successfully',
  updateSuccess: 'Goal updated successfully',
  deleteSuccess: 'Goal deleted',
  activateSuccess: 'Goal is now active',
  pauseSuccess: 'Goal paused',
  completeSuccess: 'Goal marked as complete',
  confirmDelete: 'Are you sure you want to delete this goal?',
  alreadyActiveGoal: 'You already have an active goal. Pause it first.',
},
```

**File: `src/i18n/sv.ts`**

Add Swedish translations:

```typescript
goals: {
  studioTitle: 'Mål',
  studioSubtitle: 'Skapa finansieringsmål för dina fans att stödja',
  createGoal: 'Skapa Mål',
  editGoal: 'Redigera Mål',
  deleteGoal: 'Ta Bort Mål',
  activeGoal: 'Aktivt Mål',
  noGoalsTitle: 'Inga mål ännu',
  noGoalsDescription: 'Skapa ett mål för att låta dina fans hjälpa dig nå dina drömmar. Sätt ditt eget målbelopp—inga förval eller begränsningar.',
  createFirstGoal: 'Skapa Ditt Första Mål',
  goalTitle: 'Måltitel',
  goalTitlePlaceholder: 't.ex., Ny Albumproduktion',
  goalDescription: 'Beskrivning',
  goalDescriptionPlaceholder: 'Berätta för dina fans vad detta mål handlar om...',
  targetAmount: 'Målbelopp',
  targetAmountPlaceholder: 't.ex., 5000',
  helpMeReach: 'Hjälp Mig Nå Målet',
  donate: 'Stöd',
  donating: 'Stödjer...',
  supportGoal: 'Stöd Detta Mål',
  progress: 'Framsteg',
  remaining: 'kvar till målet',
  goalComplete: 'Målet uppnått!',
  fanSupported: 'fan har stöttat',
  fansSupported: 'fans har stöttat',
  goalReached: 'Målet Uppnått! Tack för ditt stöd!',
  thankYou: 'Tack!',
  supportMessage: 'Ditt stöd betyder allt för denna artist!',
  donationSuccess: 'Tack för ditt stöd!',
  donationFailed: 'Stödet misslyckades. Försök igen.',
  invalidAmount: 'Ange ett giltigt belopp',
  signInRequired: 'Logga in för att stödja',
  amountToContribute: 'Stödbelopp',
  betaNote: 'Stöd registreras och visas på målframsteget',
  simulatedBeta: 'Simulerat i beta-läge',
  supportPoints: 'poäng',
  flyCoins: 'stöd',
  activate: 'Aktivera',
  pause: 'Pausa',
  complete: 'Markera Slutfört',
  draft: 'Utkast',
  paused: 'Pausad',
  completed: 'Slutförd',
  active: 'Aktiv',
  createSuccess: 'Mål skapat',
  updateSuccess: 'Mål uppdaterat',
  deleteSuccess: 'Mål borttaget',
  activateSuccess: 'Målet är nu aktivt',
  pauseSuccess: 'Målet pausat',
  completeSuccess: 'Målet markerat som slutfört',
  confirmDelete: 'Är du säker på att du vill ta bort detta mål?',
  alreadyActiveGoal: 'Du har redan ett aktivt mål. Pausa det först.',
},
```

---

### PHASE 5: Pre-existing Errors (Not Goals-Related)

The following errors exist in the codebase before the Goals module was added and are caused by dependency version mismatches:

**framer-motion errors** (`Property 'initial' does not exist on type...`):
- Affects: QuickAddButton, BulkActionBar, MiniAudioPreview, ContentOverlay, FanAchievementBadge, etc.
- Cause: `framer-motion` type definitions not matching React types
- Fix: Ensure consistent versions of `react`, `react-dom`, `@types/react`, `@types/react-dom`

**supabase-js errors** (`Property 'getUser' does not exist on type 'SupabaseAuthClient'`):
- Affects: ErrorBoundary, CollaboratorSelector, FanTestimonialsSection, etc.
- Cause: `@supabase/supabase-js` v2.86 has changed auth API
- Fix: Use `supabase.auth.getUser()` instead of direct property access, or ensure correct import

These are separate issues and should be addressed in a dedicated dependency update task.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useActiveGoal.ts` | Fix `Record<string, unknown>` type on line 83 |
| `src/components/artist/GoalDonationModal.tsx` | Remove FlyCoin-as-fan-currency messaging |
| `src/components/artist/ArtistGoalCard.tsx` | Add feature flag check, neutral terminology |
| `src/pages/studio/StudioGoals.tsx` | Add feature flag gate |
| `src/contexts/FeatureFlagContext.tsx` | Add `ARTIST_GOALS` to FeatureFlagKey |
| `src/i18n/en.ts` | Add goals translation section |
| `src/i18n/sv.ts` | Add goals translation section (Swedish) |

---

### Database: No Changes Required

The migration was successful. No additional database changes needed.

---

### Definition of Done Checklist

- [ ] TypeScript build passes (Goals-specific errors fixed)
- [ ] `/studio/goals` only accessible when `ARTIST_GOALS` flag is enabled
- [ ] `ArtistGoalCard` only renders when feature flag is ON + active goal exists
- [ ] No fan-facing copy implies FlyCoin is fan currency
- [ ] Beta disclaimer shown in donation modal
- [ ] Full EN/SV translations for goals section
- [ ] Client-side goal updates marked as simulated (production will require server-side validation)

