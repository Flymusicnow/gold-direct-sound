
## Artist Goal Module Implementation Plan

### Overview
Implement a "Help Me Reach Goal" module that allows artists to create funding goals in My Studio, and displays them prominently on the Artist Profile page (below hero, above tabs) for fans to donate FlyCoin towards.

---

### Phase 1: Database Schema

**New table: `artist_goals`**

```sql
CREATE TABLE artist_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  current_amount INTEGER DEFAULT 0,
  supporter_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(artist_id, status) WHERE status = 'active'
);

-- Only one active goal per artist at a time
CREATE UNIQUE INDEX artist_active_goal_idx ON artist_goals (artist_id) WHERE status = 'active';

ALTER TABLE artist_goals ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own goals
CREATE POLICY "Artists can manage own goals"
  ON artist_goals FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

-- Everyone can view active goals (for public artist pages)
CREATE POLICY "Public can view active goals"
  ON artist_goals FOR SELECT
  USING (status = 'active');
```

**New table: `goal_donations`** (tracks individual donations)

```sql
CREATE TABLE goal_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES artist_goals(id) ON DELETE CASCADE,
  fan_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE goal_donations ENABLE ROW LEVEL SECURITY;

-- Fans can view their own donations
CREATE POLICY "Fans can view own donations"
  ON goal_donations FOR SELECT
  USING (auth.uid() = fan_user_id);

-- Fans can create donations
CREATE POLICY "Fans can create donations"
  ON goal_donations FOR INSERT
  WITH CHECK (auth.uid() = fan_user_id);
```

---

### Phase 2: Studio Goal Management

**New file: `src/pages/studio/StudioGoals.tsx`**

Full-page goal management for artists with:
- List of all goals (draft, active, paused, completed)
- Create/Edit goal form with title, description, target amount
- Status controls: Activate, Pause, Complete
- Progress visualization

**New file: `src/components/studio/GoalManagementCard.tsx`**

Reusable card component for displaying a single goal in the studio:
- Status badge (draft/active/paused/completed)
- Progress bar showing current_amount / target_amount
- Edit and status toggle buttons
- Supporter count display

**New hook: `src/hooks/useArtistGoals.ts`**

```typescript
interface ArtistGoal {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  supporter_count: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

// For Studio use - fetch all goals for current artist
export function useArtistGoals(): {
  goals: ArtistGoal[];
  activeGoal: ArtistGoal | null;
  loading: boolean;
  createGoal: (data: CreateGoalInput) => Promise<Result>;
  updateGoal: (id: string, data: UpdateGoalInput) => Promise<Result>;
  activateGoal: (id: string) => Promise<Result>;
  pauseGoal: (id: string) => Promise<Result>;
  deleteGoal: (id: string) => Promise<Result>;
}
```

---

### Phase 3: Artist Profile Goal Display

**New file: `src/components/artist/ArtistGoalCard.tsx`**

Premium gold-themed card matching the reference design exactly:

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Help Me Reach Goal                               [Donate]   │
├─────────────────────────────────────────────────────────────────┤
│  Goal: {title}                                                  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  (progress bar)                │
│  🪙 {current} / {target} FlyCoins                               │
│                                                                 │
│  ❤️ {count} fans have supported this goal                       │
└─────────────────────────────────────────────────────────────────┘
```

**Design specifications:**
- Container: `rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent`
- Shadow: `shadow-gold` (soft gold glow)
- Header icon: Target emoji or Lucide Target icon
- Progress bar: `bg-gradient-gold` with rounded ends
- Donate button: `bg-gradient-gold` pill button
- Fan count: Heart icon with gold accent

**New hook: `src/hooks/useActiveGoal.ts`**

```typescript
// For Artist Profile - fetch only active goal for a specific artist
export function useActiveGoal(artistId: string): {
  goal: ArtistGoal | null;
  loading: boolean;
  donate: (amount: number) => Promise<Result>;
}
```

---

### Phase 4: Donation Flow

**New file: `src/components/artist/GoalDonationModal.tsx`**

Modal triggered by "Donate" button:
- Amount input (artist-defined, no presets)
- Fan's current FlyCoins balance display
- Confirmation with breakdown
- Success animation with confetti
- Error handling (insufficient balance, etc.)

**Economy flow (Fan → FlyMusic → Artist):**
1. Fan clicks "Donate" on ArtistGoalCard
2. GoalDonationModal opens
3. Fan enters amount and confirms
4. Edge function validates:
   - Fan has sufficient FlyCoins balance
   - Goal is still active
   - Amount is positive integer
5. Transaction:
   - Deduct from fan's wallet/balance
   - Add to goal's current_amount
   - Increment supporter_count if first donation
   - Record in goal_donations table
6. Artist's earnings update via existing payout system

---

### Phase 5: Integration Points

**Update: `src/pages/ArtistProfile.tsx`**

Insert ArtistGoalCard between SpotlightSection and content tabs:

```tsx
{/* Spotlight / Pulse Carousel */}
<SpotlightSection artistId={artist.id} artistName={artist.artist_name} />

{/* Artist Goal Card - Only renders if active goal exists */}
<ArtistGoalCard artistId={artist.id} />

{/* Preview Mode CTA */}
{isPreviewMode && (
  <div className="container mx-auto px-4 max-w-6xl">
    <PreviewGateCTA />
  </div>
)}

{/* Main Content Area with Tabs */}
```

**Update: `src/components/artist/StudioSidebar.tsx`**

Add navigation link to Goals section:
```tsx
{ icon: Target, label: 'Goals', href: '/studio/goals' }
```

**Update: `src/App.tsx` routes**

Add route for studio goals page:
```tsx
<Route path="/studio/goals" element={<StudioGoals />} />
```

---

### Phase 6: Technical Details

**Files to create:**
| File | Purpose |
|------|---------|
| `src/pages/studio/StudioGoals.tsx` | Goal management page |
| `src/components/studio/GoalManagementCard.tsx` | Goal card for studio |
| `src/components/studio/CreateGoalDialog.tsx` | Create/edit goal modal |
| `src/components/artist/ArtistGoalCard.tsx` | Public goal display |
| `src/components/artist/GoalDonationModal.tsx` | Donation flow modal |
| `src/hooks/useArtistGoals.ts` | Studio goal management |
| `src/hooks/useActiveGoal.ts` | Public goal fetch + donate |

**Files to modify:**
| File | Change |
|------|--------|
| `src/pages/ArtistProfile.tsx` | Add ArtistGoalCard |
| `src/components/artist/StudioSidebar.tsx` | Add Goals nav link |
| `src/App.tsx` | Add /studio/goals route |

**Database migration:**
- Create artist_goals table
- Create goal_donations table
- Add RLS policies
- Add trigger for updated_at

---

### Visual Specifications (Gold Theme)

**Progress bar styles:**
```css
/* Container */
.goal-progress-track {
  height: 12px;
  background: hsl(0 0% 15%);
  border-radius: 9999px;
  overflow: hidden;
}

/* Fill */
.goal-progress-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: 9999px;
  transition: width 500ms ease-out;
}
```

**Card container:**
```tsx
<div className={cn(
  "rounded-xl p-6",
  "border border-primary/30",
  "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
  "shadow-gold",
  "backdrop-blur-sm"
)}>
```

**Donate button:**
```tsx
<Button className="bg-gradient-gold text-primary-foreground font-semibold rounded-full px-6 shadow-gold hover:opacity-90 transition-opacity">
  <Coins className="h-4 w-4 mr-2" />
  Donate
</Button>
```

---

### Validation Rules

1. **Goal title**: Required, 1-100 characters
2. **Goal description**: Optional, max 500 characters
3. **Target amount**: Required, positive integer, no system defaults
4. **Status transitions**:
   - draft → active (if no other active goal)
   - active → paused
   - paused → active (if no other active goal)
   - active/paused → completed (manual or auto at 100%)

---

### Role Separation Enforcement

| Action | Artist | Fan | Public |
|--------|--------|-----|--------|
| Create goal | ✓ | ✗ | ✗ |
| Edit goal | ✓ | ✗ | ✗ |
| Activate/Pause goal | ✓ | ✗ | ✗ |
| View active goal | ✓ | ✓ | ✓ |
| Donate to goal | ✗ | ✓ | ✗ |
| View donation history | Own only | Own only | ✗ |

---

### Test Cases

1. **Studio goal creation**: Artist can create goal with custom title, description, and exact target amount
2. **Single active goal**: Only one goal can be active at a time
3. **Goal visibility**: Active goal appears on artist profile; draft/paused goals do not
4. **Donation flow**: Fan can donate, balance updates, supporter count increments
5. **No goal state**: ArtistGoalCard renders nothing when no active goal
6. **Mobile responsiveness**: Card adapts to mobile viewport (stacked layout)
7. **Progress accuracy**: Progress bar width matches current_amount / target_amount ratio
