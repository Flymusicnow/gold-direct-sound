

# Fix Mobile Feed Layout: Cut-off Cards, Remove Text and Icons

## Issues Found

Looking at the screenshot, there are three distinct problems on the mobile feed page:

1. **Track cards overflow the screen width** -- the song boxes are cut off on the right side because the card tries to fit a 60px thumbnail + song title + 3 action buttons (playlist, queue, like) all in one row, which exceeds the mobile viewport width.

2. **"Discover from your favorites" subtitle text** -- the user wants this removed.

3. **Dashboard/Feed pill switch** (the house icon and RSS icon) -- the user wants this removed from the feed page.

## Changes

### 1. Remove "Discover from your favorites" text
**File:** `src/pages/FanFeed.tsx` (line 338)

Remove the `<p>` element containing the subtitle text. The "Your Feed" heading remains.

### 2. Remove the Dashboard/Feed switch (house + RSS icons)
**File:** `src/pages/FanFeed.tsx` (line 340)

Remove the `<DashboardFeedSwitch />` component from the feed page header. This removes the pill-shaped toggle with the house and RSS icons.

### 3. Fix track cards being cut off on mobile
**File:** `src/components/TrackCard.tsx`

The card currently shows 3 action buttons side by side (playlist, queue, like) which takes ~108px. Combined with the 60px thumbnail, gap spacing, and text, this overflows narrow mobile screens.

The fix: On mobile, hide the "Add to queue" button (the `+` icon). Users can still access queue functionality through the player. This brings the action area from 3 buttons down to 2, which fits comfortably on all mobile widths.

- Wrap the "Add to queue" button with `hidden md:flex` so it only shows on desktop
- The playlist button and like button remain always visible
- The buttons already use `h-9 w-9` sizing which is touch-friendly

### 4. Ensure the "Play All" button is not cut off
**File:** `src/components/feed/FeedMusicTab.tsx`

The "Play All" button wrapper uses `justify-between` with only one child, which is fine. But the parent `space-y-4` combined with the sticky header margin can cause issues. Add `overflow-hidden` protection to ensure nothing bleeds out.

## Files Summary

| File | Change |
|------|--------|
| `src/pages/FanFeed.tsx` | Remove "Discover from your favorites" text and `DashboardFeedSwitch` component |
| `src/components/TrackCard.tsx` | Hide "Add to queue" button on mobile (`hidden md:flex`) to prevent card overflow |

