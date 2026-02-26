
# Add Supabase Realtime to Artist Goals + Verify Animation Fix

## Current State

The optimistic update and 10s polling are already implemented in `useActiveGoal.ts`. The goal meter will update immediately after a donation without a page refresh.

## What to Add: Realtime Subscription

Replace (or supplement) the 10-second polling with a Supabase Realtime subscription on the `artist_goals` table. This means:

- When **any** fan donates to an artist's goal, the DB row is updated by the `donate_to_goal` RPC.
- Realtime will push a `UPDATE` event to all connected clients subscribed to that row.
- The goal card updates **instantly** (< 200ms) instead of waiting up to 10 seconds.

The polling will be kept as a fallback for cases where the Realtime WebSocket is temporarily unavailable.

## Database Change Required

The `artist_goals` table must be added to the Supabase Realtime publication. This is a one-line SQL migration:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_goals;
```

## Code Change: `src/hooks/useActiveGoal.ts`

Add a `useEffect` that:
1. Creates a Supabase channel scoped to `artist_goals:artist_id=eq.<artistId>`.
2. Listens for `UPDATE` events on the `artist_goals` table.
3. On receiving an update, merges the incoming payload into state — but only if the authoritative `current_amount` is ≥ the local optimistic value (never roll back a fresh optimistic update).
4. Cleans up the channel subscription on unmount or when `artistId` changes.

### Key snippet

```ts
useEffect(() => {
  if (!artistId) return;

  const channel = supabase
    .channel(`artist_goals:${artistId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'artist_goals',
        filter: `artist_id=eq.${artistId}`,
      },
      (payload) => {
        const updated = payload.new as ArtistGoal;
        // Only apply if the realtime value is >= optimistic state
        // to avoid rolling back a just-applied optimistic update
        setGoal(prev => {
          if (!prev) return updated;
          if (updated.current_amount >= prev.current_amount) return updated;
          return prev; // keep optimistic until next poll/event catches up
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [artistId]);
```

## Files to Change

| File | Change |
|------|--------|
| Database migration | `ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_goals` |
| `src/hooks/useActiveGoal.ts` | Add Realtime subscription `useEffect`; keep 10s polling as fallback |

## What This Achieves

- Own donation: optimistic update fires instantly → Realtime confirms within ~200ms → polling syncs authoritative value every 10s.
- Other fan's donation: Realtime pushes the update in real time (< 200ms) instead of up to 10s delay.
- Network hiccup: polling catches up within 10 seconds even if Realtime drops.
- RPC failure: optimistic update is never applied; the error is returned to the UI.
