

# SUPER CARD: UI Coherence + Wave Gating + Artist Feed (MVP)

Four workstreams, ordered by impact and dependency.

---

## 1. Fix i18n Key Leaks (e.g. "studio.creatorControlRoom")

**Problem**: The sidebar shows the raw key `studio.creatorControlRoom` because it doesn't exist in either `en.ts` or `sv.ts`. Only `studio.controlRoom` exists.

**Fix (2 parts)**:

A. **Add the missing key** to both i18n files:
- `src/i18n/en.ts`: Add `creatorControlRoom: 'Creator Control Room'` under the `studio` section
- `src/i18n/sv.ts`: Add `creatorControlRoom: 'Kreativt kontrollrum'` under the `studio` section

B. **Add a runtime guard** so raw keys never reach the UI again:
- Update `StudioSidebar.tsx` (and similar surfaces) to use the existing `safeT()` helper from `src/lib/i18nSafe.ts`
- Pattern: `safeT(t, 'studio.creatorControlRoom', 'Control Room')` -- if the key resolves to itself, the fallback is shown
- Scan for any other `t('...')` calls that use dotted keys not present in the i18n files (audit pass)

**Files**: `src/i18n/en.ts`, `src/i18n/sv.ts`, `src/components/artist/StudioSidebar.tsx`

---

## 2. Notification Orchestrator (Batch Updates)

**Problem**: The `NotificationBell` fetches notifications independently, and each real-time INSERT triggers a full refetch. Multiple near-simultaneous notifications cause the badge, list, and toasts to update in visible "jerks."

**Fix**: Introduce a lightweight batching layer inside `NotificationBell`:

- Add a `batchRef` + `setTimeout` (100ms window) so that rapid real-time INSERTs are coalesced into a single `fetchNotifications()` call
- This ensures badge count, list, and any toast all update from the same data snapshot
- No new context/store needed -- the batching lives inside the existing component

**Implementation detail**:
```
// Inside the realtime subscription callback:
// Instead of calling fetchNotifications() directly,
// queue it and debounce with a 100ms window
const pendingRef = useRef<NodeJS.Timeout | null>(null);

const debouncedFetch = useCallback(() => {
  if (pendingRef.current) clearTimeout(pendingRef.current);
  pendingRef.current = setTimeout(() => {
    fetchNotifications();
  }, 100);
}, []);
```

**Files**: `src/components/notifications/NotificationBell.tsx`

---

## 3. Invite Friends -> "Coming Soon" + Feature Flag

**Problem**: The Invite Friends card is fully functional but should be gated for Wave 1.

**Fix (2 parts)**:

A. **Add feature flag** `REFERRALS_ENABLED` to the `feature_flags` table, set to `false`:
- Database migration: `INSERT INTO feature_flags (flag_key, flag_name, is_enabled, description) VALUES ('REFERRALS_ENABLED', 'Referrals', false, 'Artist referral/invite system')`

B. **Update `InviteFriendsCard`** to check the flag:
- Import `useFeatureFlag` from `src/hooks/useFeatureFlag`
- When `REFERRALS_ENABLED` is false:
  - Keep the card visible but overlay a "Coming Soon" badge
  - Disable buttons (Generate Code, Copy)
  - Show microcopy: "Coming in a future update. Focus now: community + profiles."
- When the flag is true: render the current fully-functional card as-is

C. **Update `FeatureFlagContext.tsx`** to include `'REFERRALS_ENABLED'` in the `FeatureFlagKey` type

**Files**: `src/components/artist/InviteFriendsCard.tsx`, `src/contexts/FeatureFlagContext.tsx`, DB migration

---

## 4. Artist Page Feed ("Mingelrum" v1)

**Problem**: The artist public page has no activity feed. The community feed exists at `/community/:artistId` but isn't surfaced on the main artist profile.

**Fix**: Add a "Feed" tab to the existing `ArtistProfile.tsx` tab system that embeds a simplified version of the community feed (posts, comments, reactions only -- no economy triggers).

**Implementation**:

A. **New component**: `src/components/artist/ArtistActivityFeed.tsx`
- Reuses `CommunityFeed` internally, passing the artist's ID
- Identity guardrail: `author_type` from `community_posts` is always respected -- fans can never get artist labels
- No new tables needed -- uses existing `community_posts`, `post_comments`, `post_reactions`

B. **Add "Feed" tab** to `ArtistProfile.tsx`:
- New tab alongside existing Music/Videos/About tabs
- Icon: `Users` from lucide
- Renders `ArtistActivityFeed` which wraps `CommunityFeed`

C. **i18n keys**:
- `en.ts`: `artist.feed: 'Feed'`, `artist.communityActivity: 'Community Activity'`
- `sv.ts`: `artist.feed: 'Flode'`, `artist.communityActivity: 'Community-aktivitet'`

**Wave 1 guardrails**:
- No ranking manipulation or economy triggers
- No "chat room" -- just a scrolling feed of posts with reactions/comments
- Fan posts are always labeled as fan, artist posts as artist (enforced by `author_type` column)

**Files**: New `src/components/artist/ArtistActivityFeed.tsx`, `src/pages/ArtistProfile.tsx`, `src/i18n/en.ts`, `src/i18n/sv.ts`

---

## Release Order

| Step | What | Risk | Time |
|------|------|------|------|
| 1 | i18n key fix + runtime guard | None | Small |
| 2 | Notification batching | None | Small |
| 3 | Invite Friends Coming Soon + flag | None (visual only) | Small |
| 4 | Artist Feed v1 tab | Low (reuses existing community infra) | Medium |

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/i18n/en.ts` | Add `creatorControlRoom`, feed keys |
| `src/i18n/sv.ts` | Add `creatorControlRoom`, feed keys |
| `src/components/artist/StudioSidebar.tsx` | Use `safeT()` for subtitle |
| `src/components/notifications/NotificationBell.tsx` | Debounced realtime fetch |
| `src/components/artist/InviteFriendsCard.tsx` | Feature flag gate + Coming Soon UI |
| `src/contexts/FeatureFlagContext.tsx` | Add `REFERRALS_ENABLED` to type |
| `src/components/artist/ArtistActivityFeed.tsx` | New wrapper component |
| `src/pages/ArtistProfile.tsx` | Add Feed tab |
| DB migration | Insert `REFERRALS_ENABLED` flag |

