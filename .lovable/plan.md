
# Community First Rebuild — Wave 1 Lock-In

## What This Is

This is a large-scale restructuring of FlyMusic to make **Community the default experience** on the artist page, while simultaneously gating all Wave 2+ features (Spotlight, Merch, Subscriptions, Events, Livestreams, Promo, etc.) so they are completely invisible to fans and artists until toggled ON by an admin.

This is not a rebuild from scratch. The community infrastructure (posts, comments, reactions, moderation) already exists. The work is about **restructuring what is shown and when**.

---

## Current State

**Artist Page (`/artist/:id`):**
- Default tab is "Tracks"
- Community is one of 6 tabs (Tracks, Videos, Merch, About, Community, Feed)
- Community tab just redirects to `/artist/:id/community` — it does not render inline
- Spotlight, Stats, Merch, Supporters sidebar are always visible

**Studio Dashboard (`/studio`):**
- Shows Spotlight stats, Posts, Quick Actions — all mixed together
- `StudioCommunity` page (`/studio/community`) exists with Settings + Moderators + Analytics tabs — this is already good

**Navigation:**
- Desktop shows: Brand Opportunities, My Artist Page, My Studio (for artists)
- Fan mobile bottom bar: Home, Feed, Vote, Board, More

**Feature Flags:**
- `FeatureFlagContext` exists but flags are fetched from `feature_flags` table
- Many flags exist (`SPOTLIGHT_CAROUSEL`, `COMMUNITY_FEED`, etc.)
- **No flags currently gate Spotlight, Merch, Events, Subscriptions in the UI**

---

## What Needs to Change

### 1. Artist Page — Community as Default Tab

**File: `src/pages/ArtistProfile.tsx`**

- Change `defaultValue="tracks"` → `defaultValue="community"` on the `<Tabs>` component
- The Community tab currently shows a placeholder that redirects to a separate page. Instead, render `CommunityFeed` directly inline within the tab (as already done on `/artist/:id/community`)
- Remove the "Enter Community" redirect button — community is now the default experience
- Gate the following tabs/sections behind feature flags:
  - **Merch tab** → gate behind `merch_enabled` flag (hidden when OFF)
  - **Spotlight sidebar card** (`ArtistSpotlightCard`) → gate behind `spotlight_enabled`
  - **Spotlight section** (`SpotlightSection`) → gate behind `spotlight_enabled`
  - **Become a Supporter** button → gate behind `subscriptions_enabled`
  - **Feed tab** — keep as-is (it's an activity feed, not a Spotlight/Economic feature)

### 2. Artist Page — Tab Order and Visibility

New tab order:
1. **Community** (default) — inline CommunityFeed
2. **About**
3. **Tracks**
4. **Videos**
5. ~~Merch~~ — hidden when `merch_enabled = false`
6. ~~Feed~~ — keep (it's basic activity, not a gated feature)

### 3. Artist Page — Sidebar Cleanup

Remove or gate in sidebar:
- `SpotlightSection` and `ArtistSpotlightCard` → only show when `spotlight_enabled = true`
- `TopSupportersCard` → keep (it shows community engagement)
- "Become a Supporter" button → only show when `subscriptions_enabled = true`
- "View Achievements" button → gate behind `artist_achievements_enabled`

### 4. Studio Navigation — Community as Primary Entry Point

**File: `src/components/layouts/StudioLayout.tsx`** (need to check)

The Studio sidebar/navigation should surface **Community** prominently and hide gated items:
- Move "Community" to the top of the sidebar (after Dashboard)
- Hide or de-emphasize: Spotlight, Earnings, Merch, Live Streams, Promo, Subscriptions, Events, Opportunities
- These should only appear when their respective feature flags are ON

### 5. Feature Flag Sync — Add Wave 1 Flags to Database

The following flag keys need to exist in the `feature_flags` table (many may already exist, need to insert the missing ones):

**Wave 1 ON flags (insert with `is_enabled = true`):**
- `community_enabled`
- `community_feed_enabled`
- `community_post_creation_artist_only`
- `community_comments_enabled`
- `community_reactions_enabled`
- `community_pinned_post_enabled`
- `community_reporting_enabled`
- `community_moderators_enabled`
- `artist_profile_enabled`
- `artist_follow_enabled`

**Wave 2+ OFF flags (insert with `is_enabled = false`):**
- `spotlight_enabled`
- `merch_enabled`
- `livestream_enabled`
- `events_enabled`
- `subscriptions_enabled`
- `flycoins_enabled`
- `earnings_dashboard_enabled`
- `stripe_connect_enabled`
- `brand_opportunities_enabled`
- `promo_links_enabled`
- `deep_links_enabled`
- `artist_stats_visible`
- `artist_achievements_enabled`
- `advanced_analytics_enabled`

### 6. Studio Sidebar — Gate Navigation Items

**File: `src/components/layouts/StudioLayout.tsx`**

Using `useFeatureFlags` hook, hide nav items for:
- Spotlight (`/studio/spotlight`) → hide when `spotlight_enabled = false`
- Pulse (`/studio/pulse`) → always hide (no flag needed, link just removed)
- Earnings (`/studio/earnings`) → hide when `earnings_dashboard_enabled = false`
- Merch (`/studio/merch`) → hide when `merch_enabled = false`
- Live Streams (`/studio/live-streams`) → hide when `livestream_enabled = false`
- Events (`/studio/events`) → hide when `events_enabled = false`
- Promo (`/studio/promo`) → hide when `promo_links_enabled = false`
- Subscription (`/studio/subscription`) → hide when `subscriptions_enabled = false`
- Opportunities (`/studio/opportunities`) → hide when `brand_opportunities_enabled = false`
- Smart Link (`/studio/smart-link`) → keep visible (it's a basic sharing tool)

### 7. Fan Navigation — Remove Gated Feature Links

**File: `src/components/mobile/BottomNavBarFan.tsx`**

Current items: Home, Feed, Vote (→ Spotlight!), Board (→ Spotlight leaderboard!), More

- Remove **Vote** tab (links to `/fan/vote` → Spotlight) when `spotlight_enabled = false`
- Remove **Board** tab (links to `/fan/leaderboard`) when `spotlight_enabled = false`
- Replace with: Home, Feed, Explore, More

**File: `src/components/fan/MobileFanNav.tsx`** (need to check)

Apply same gating for Spotlight-related items in the "More" sheet.

**File: `src/components/Navigation.tsx`**

No changes needed for core nav — Explore and Search are always ON.

### 8. CommunityFeed Inline on Artist Page

The existing `ArtistCommunityPage` already has a full community experience. The inline version for the tab needs:
- Import `CommunityFeed` directly into `ArtistProfile.tsx`
- Pass `artistId={artist.id}` directly
- The `CommunityFeed` component already handles `isArtistOwner` and shows the composer for the artist

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/ArtistProfile.tsx` | Community default tab, inline CommunityFeed, gate Merch/Spotlight/Subscriptions |
| `src/components/layouts/StudioLayout.tsx` | Gate sidebar nav items behind feature flags |
| `src/components/mobile/BottomNavBarFan.tsx` | Remove Vote/Board tabs, add Explore; gate Spotlight items |
| `src/components/fan/MobileFanNav.tsx` | Gate Spotlight items |
| Database migration | Insert Wave 1 ON + Wave 2 OFF flags into `feature_flags` table |

---

## What Does NOT Change

- `/artist/:id/community` page — still accessible directly (used for "full page" community view)
- `StudioCommunity.tsx` — already has Settings + Moderators + Analytics tabs, no changes needed
- Auth / signup / login flows — untouched
- All existing Spotlight/Earnings/etc. pages — still exist and work, just not linked from nav
- Admin panel — admins can still access all pages directly and toggle flags

---

## Technical Notes

### Gating Pattern
Using the existing `useFeatureFlags` hook:
```tsx
const { isEnabled } = useFeatureFlags();
// In render:
{isEnabled('spotlight_enabled') && <SpotlightSection ... />}
```

### Community Tab Inline Rendering
```tsx
<TabsContent value="community" className="mt-0">
  <CommunityFeed artistId={artist.id} />
</TabsContent>
```
The `CommunityFeed` already handles empty/loading states and polls for updates.

### Flag Key Convention
All new flags use `snake_case` matching the existing `FeatureFlagKey` type. New keys must be added to the `FeatureFlagKey` union in `src/contexts/FeatureFlagContext.tsx`.

### Database
Flags are inserted via the data insert tool (not schema migration), as this is data not schema change.

---

## Result

After this change:
- A fan visiting `/artist/:id` sees **Community first** — posts, reactions, comments
- No Spotlight/Voting/Merch/Subscription buttons visible anywhere unless flags are turned ON
- Artists in Studio see Community prominently, Spotlight/Earnings/Merch nav hidden
- Admin can toggle any feature flag ON in the Admin → Features panel to re-enable gated features
- The codebase remains intact — nothing is deleted, just conditionally rendered
