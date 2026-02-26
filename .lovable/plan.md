
# Bugfix: Goal meter does not update after donation

## Root Cause

Two problems compound to cause the stale UI:

1. **Double `useActiveGoal` instance**: `ArtistGoalCard` creates its own hook instance (`const { goal, loading } = useActiveGoal(artistId)`) and `GoalDonationModal` creates a *separate* instance (`const { donate } = useActiveGoal(artistId)`). After the donation succeeds, only the modal's internal `fetchActiveGoal` runs — the card's state is never updated.

2. **No optimistic update**: The `donate` function in `useActiveGoal` waits for the full round-trip before calling `fetchActiveGoal`, so even in the single-instance case there is a visible delay and no animation.

## Fix Strategy

### 1. Lift state — single `useActiveGoal` instance
In `ArtistGoalCard`, pass `donate` down to `GoalDonationModal` as a prop instead of letting the modal instantiate its own hook. This ensures one source of truth.

### 2. Optimistic update in `useActiveGoal.donate()`
After calling the RPC and getting a success response:
- Immediately call `setGoal(prev => ({ ...prev, current_amount: prev.current_amount + amount, supporter_count: prev.supporter_count + 1 }))` so the card reflects the new value instantly.
- Then call `fetchActiveGoal()` in the background to sync with the real DB value.
- On RPC error: do not optimistically update; just return the error.

### 3. Animated amount counter
Add a `useAnimatedCounter` hook (already exists at `src/hooks/use-animated-counter.ts`) to `ArtistGoalCard` so the displayed amount animates from old → new value (700ms ease-out).

### 4. Animated progress bar
The progress bar `<div>` already has `transition-all duration-500 ease-out` — the CSS transition will fire automatically when `goal.current_amount` changes, which means steps 1+2 above will make it animate for free.

### 5. Polling every 10 seconds
Add a `useInterval` (or `useEffect` with `setInterval`) inside `useActiveGoal` to call `fetchActiveGoal` every 10 seconds while the hook is mounted, so donations from other users appear without a refresh.

## Files to Change

| File | Change |
|------|--------|
| `src/hooks/useActiveGoal.ts` | Optimistic update after donate, 10s polling, expose `donate` |
| `src/components/artist/ArtistGoalCard.tsx` | Pass `donate` to modal, wire animated counter to `goal.current_amount` |
| `src/components/artist/GoalDonationModal.tsx` | Accept `donate` as prop instead of calling `useActiveGoal` again |

## Technical Detail

### useActiveGoal.ts — key change
```ts
// Optimistic update before refetch
setGoal(prev => prev ? {
  ...prev,
  current_amount: prev.current_amount + amount,
  supporter_count: prev.supporter_count + 1,
} : prev);

// Background sync — does NOT block the UI
fetchActiveGoal();
return { success: true };
```

### Polling
```ts
useEffect(() => {
  if (!artistId) return;
  const id = setInterval(fetchActiveGoal, 10_000);
  return () => clearInterval(id);
}, [artistId, fetchActiveGoal]);
```

### Animated counter in ArtistGoalCard.tsx
```tsx
const { count: displayAmount } = useAnimatedCounter(
  goal.current_amount, 700, true
);
```
The existing `useAnimatedCounter` hook handles rapid re-targeting: because `target` is a prop, any new value will kick off a fresh animation from where it currently sits.

### GoalDonationModal.tsx — prop instead of hook
```tsx
interface GoalDonationModalProps {
  ...
  donate: (amount: number) => Promise<{ success: boolean; error?: string }>;
}
// Remove: const { donate } = useActiveGoal(artistId);
```

## Rollback Safety
- The optimistic update only fires after a confirmed `result.success === true` from the RPC.
- If the RPC errors, no optimistic update is applied and the error is surfaced to the user.
- The background `fetchActiveGoal()` that follows every successful donation will overwrite the optimistic state with the authoritative DB value within one network round-trip.
- The 10s polling also continuously corrects any drift.
