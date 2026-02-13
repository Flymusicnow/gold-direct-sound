

# Event Tracking (MVP) -- Implementation Plan

## Context

The project already has a `telemetry_events` table and FlightRecorder system, but that's flow-based telemetry (trace_id, flow, step, status). The MVP spec calls for a **separate, simpler `events` table** for append-only user action logging (play, skip, save, follow, vote, search, etc.) with its own edge function endpoint and frontend helper.

## 1. Database: Create `events` table

New migration to create:

```sql
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  track_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX idx_events_user_created ON public.events (user_id, created_at DESC);
CREATE INDEX idx_events_track_created ON public.events (track_id, created_at DESC);
CREATE INDEX idx_events_type_created ON public.events (event_type, created_at DESC);

-- RLS: append-only for authenticated users (insert own, no update/delete)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin read-only access
CREATE POLICY "Admins can read all events"
  ON public.events FOR SELECT TO authenticated
  USING (public.is_admin());
```

No UPDATE or DELETE policies -- enforces append-only at the database level.

## 2. Edge Function: `POST /track-event`

New edge function at `supabase/functions/track-event/index.ts`:

- Validates JWT via `getClaims()`
- Validates `event_type` against allowlist: `session_start`, `session_end`, `play`, `skip`, `complete`, `save`, `follow`, `vote`, `search`
- Validates `track_id` is required for: `play`, `skip`, `complete`, `save`, `vote`
- Validates `metadata` is an object if provided
- Inserts into `events` table using service role client
- Returns `{ ok: true }` on success
- Never crashes the caller on failure

Config in `supabase/config.toml`:
```toml
[functions.track-event]
verify_jwt = false
```

## 3. Frontend Helper: `useEventTracker` hook

New file: `src/hooks/useEventTracker.ts`

Provides a single function:
```ts
trackEvent(eventType, { trackId?, sessionId?, metadata? })
```

Key behaviors:
- Fire-and-forget (no await, no crash on failure)
- Uses the edge function endpoint
- Includes auth token in headers
- Console warns on failure in dev mode
- Returns void (caller never waits)

## 4. Instrumentation Points

Wire `trackEvent` calls into existing components:

| Event | Where | Metadata |
|-------|-------|----------|
| `session_start` | `App.tsx` on auth state change (login) | -- |
| `session_end` | `App.tsx` on logout | -- |
| `play` | FlightdeckContext `playNow()` | `{ position_seconds: 0 }` |
| `skip` | FlightdeckContext next track / skip action | `{ position_seconds }` |
| `complete` | FlightdeckContext on track end | `{ duration_seconds }` |
| `save` | `useLikeTrack` toggle on | -- |
| `follow` | `useFollowArtist` toggle on | -- |
| `vote` | `useSpotlightVote` toggle on | -- |
| `search` | Search input on submit | `{ query }` |

Each call is wrapped in try/catch so the app never crashes from event tracking.

## 5. Admin Event Log Page

New page: `src/pages/admin/AdminEventLog.tsx`

- Route: `/admin/event-log` (admin-protected)
- Shows latest 100 events (created_at DESC)
- Filters: event_type dropdown, user_id text input, track_id text input
- Each row shows: timestamp, event_type (badge), user_id, track_id, session_id, metadata (collapsible JSON)
- Auto-refresh button
- Uses direct Supabase client query (admin RLS policy allows SELECT)

## File Summary

| File | Action | What |
|------|--------|------|
| Migration SQL | CREATE | `events` table + indexes + RLS |
| `supabase/functions/track-event/index.ts` | CREATE | Edge function with validation |
| `supabase/config.toml` | EDIT | Add `[functions.track-event]` |
| `src/hooks/useEventTracker.ts` | CREATE | Frontend helper hook |
| `src/pages/admin/AdminEventLog.tsx` | CREATE | Admin debug view |
| `src/App.tsx` | EDIT | Add route + session_start/end tracking |
| `src/contexts/FlightdeckContext.tsx` | EDIT | Add play/skip/complete tracking |
| `src/hooks/useLikeTrack.ts` | EDIT | Add save event |
| `src/hooks/useFollowArtist.ts` | EDIT | Add follow event |
| `src/hooks/useSpotlightVote.ts` | EDIT | Add vote event |
| Search component (TBD) | EDIT | Add search event |

## What This Does NOT Do

- No recommendations or ranking logic
- No AI processing of events
- No frontend behavior changes based on event data
- No rate limiting in v1 (noted as TODO in edge function)
- Events are strictly append-only (no UPDATE/DELETE policies)

