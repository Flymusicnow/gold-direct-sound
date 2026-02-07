
# Fix: Artist Name Navigation + Compact Music Cards on Mobile

## Issue 1: Tapping Artist Name Goes to Feed Instead of Artist Profile

### Root Cause

In `FullScreenVideoItem.tsx`, `handleArtistTap` calls two things in sequence:
1. `onClose()` -- which triggers `closeFeedWithHistory()` in the hook
2. `navigate('/artist/...')` -- which should go to the artist page

The problem: `closeFeedWithHistory()` calls `window.history.back()`. This is an **asynchronous** browser action that navigates the page backward. The subsequent `navigate()` call fires immediately after, but `history.back()` wins the race and sends the user back to `/fan/feed`, not the artist profile.

### Fix

Add a dedicated `closeFeedForNavigation` method to `useFullScreenVideoFeed.ts` that closes the feed state **without** calling `history.back()`. Instead, it removes the pushed history entry silently so the navigate call works cleanly.

**File: `src/hooks/useFullScreenVideoFeed.ts`**
- Add a new method `closeFeedForNavigation()` that:
  - Sets `isOpen: false` directly (no history.back)
  - Removes the body scroll lock
  - Does NOT call `history.back()` -- the subsequent `navigate()` replaces the history entry naturally

**File: `src/components/video/FullScreenVideoItem.tsx`**
- Accept a new `onNavigateToArtist` prop (or modify `onClose` usage)
- In `handleArtistTap`: call `closeFeedForNavigation()` instead of `onClose()`, then navigate to the artist profile

**File: `src/components/video/FullScreenVideoFeed.tsx`**
- Accept and pass through the `closeFeedForNavigation` callback to each `FullScreenVideoItem`

**Files using the hook:**
- `src/components/feed/FeedVideosTab.tsx` -- pass `closeFeedForNavigation` through
- `src/components/artist/ArtistVideosSection.tsx` -- pass `closeFeedForNavigation` through

---

## Issue 2: Music Track Cards Too Tall on Mobile

### Root Cause

In `TrackCard.tsx`, the mobile sizing is oversized:
- Padding: `p-6` (24px on all sides on mobile)
- Cover image: `w-24 h-24` (96px square on mobile)
- Title: `text-lg` (18px on mobile)
- Artist name: `text-base` (16px on mobile)
- Action buttons: `h-10 w-10` (40px on mobile)

This makes each card very tall and elongated as seen in the screenshots -- only 2-3 cards fit on screen.

### Fix

Reduce mobile sizes to make cards compact while keeping good touch targets:

**File: `src/components/TrackCard.tsx`**
- Padding: `p-3 md:p-4` (12px mobile, 16px desktop)
- Cover image: `w-14 h-14 md:w-16 md:h-16` (56px mobile, 64px desktop)
- Title: `text-base md:text-sm` (16px mobile -- still readable, keeps font hierarchy)
- Artist name: `text-sm md:text-xs` (14px mobile)
- Description: keep `text-xs`
- Gap between items: `gap-3 md:gap-4`
- Action buttons: keep `h-10 w-10` for touch targets (44px min rule)
- Play button overlay: scale down to match smaller cover

This will show 5-6 cards per screen on mobile instead of 2-3.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useFullScreenVideoFeed.ts` | Add `closeFeedForNavigation` method that closes without history.back |
| `src/components/video/FullScreenVideoFeed.tsx` | Accept and pass through navigation close callback |
| `src/components/video/FullScreenVideoItem.tsx` | Use navigation-specific close for artist tap |
| `src/components/feed/FeedVideosTab.tsx` | Pass navigation close callback |
| `src/components/artist/ArtistVideosSection.tsx` | Pass navigation close callback |
| `src/components/TrackCard.tsx` | Reduce mobile padding, cover size, and font sizes |

---

## Acceptance Criteria

- Tapping artist name in video feed navigates to the artist's profile page
- Browser back from artist profile returns to the feed page (not broken history)
- X button and swipe-to-close still work correctly (using history.back as before)
- Music track cards are compact on mobile (5-6 visible per screen)
- Track cards remain readable with proper touch targets
- Desktop layout is unchanged
