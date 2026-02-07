
# Unified Full-Screen Video Feed + Artist Profile Clipping Fix

## Overview

This plan addresses two critical issues and one major feature:
1. **Artist profile clipping on mobile** - avatar/name hidden behind navbar
2. **Full-screen vertical video feed** - TikTok/Reels-style swipe experience
3. **Unified video feed system** - one code path for all entry points

---

## Part 1: Artist Profile Clipping Fix

### Problem
The hero section avatar and name get clipped behind the fixed 64px navbar on mobile. The current `aspect-[5/2]` ratio gives ~150px on a 375px screen, but the avatar (96px) plus name/badges/buttons requires more vertical space. The content is `absolute bottom-0` positioned, so it overflows upward behind the navbar.

### Fix
Change the layout approach so the profile info section has guaranteed minimum height rather than relying solely on the banner aspect ratio to contain it.

**File: `src/components/artist/ArtistHeroSection.tsx`**

- Add `min-h-[280px] md:min-h-0` to the outer container so on mobile the hero section always has enough room for the profile overlay content
- This works alongside the existing `aspect-[5/2]` ratio -- the aspect ratio applies when the banner image is tall enough, and `min-h` kicks in as a safety net when content needs more space

---

## Part 2: Full-Screen Vertical Video Feed (New Component)

### Architecture

Create a single unified `FullScreenVideoFeed` component that acts as a full-screen overlay with vertical snap-scrolling. This is used from every entry point (Feed, Artist profile, Spotlight, Explore).

```text
+------------------------------------------+
|  [X Close]                    [Mute icon] |
|                                           |
|         FULL SCREEN VIDEO                 |
|         (object-cover, 100vh)             |
|                                           |
|  [Avatar] Artist Name  (tappable)         |
|  Caption text...                          |
|                                           |
|  [Like] [Share] [More]    (right sidebar) |
+------------------------------------------+
     Swipe up/down = next/prev video
```

### New Files

**1. `src/components/video/FullScreenVideoFeed.tsx`**

The core feed component. Accepts:
- `videos`: array of video objects (id, video_url, thumbnail_url, caption, artist info)
- `initialIndex`: which video to start on
- `onClose`: callback to dismiss the feed
- `onLoadMore`: optional callback for infinite scroll

Features:
- Fixed full-screen overlay (`fixed inset-0 z-[100] bg-black`)
- CSS `snap-y snap-mandatory` container with `overflow-y-scroll`
- Each video occupies `h-[100dvh] snap-start`
- IntersectionObserver to autoplay the visible video and pause others
- Touch swipe detection for smooth transitions
- Muted autoplay with unmute button (mobile autoplay policy)
- Close button (top-left X)
- Artist info overlay (bottom-left) with tappable name for navigation
- Action bar (right side): Like, Share, More
- Preloads adjacent videos for instant transition

**2. `src/components/video/FullScreenVideoItem.tsx`**

Individual video card within the feed:
- Full-height video with `object-cover`
- Thumbnail `<img>` shown until video can play (no black frames)
- Play/pause on tap (center of screen)
- Double-tap to like (heart animation)
- Artist avatar + name (tappable, navigates to profile)
- Caption text (bottom, max 2 lines)
- Autoplay when in view via IntersectionObserver

**3. `src/hooks/useFullScreenVideoFeed.ts`**

State management hook:
- Tracks `isOpen`, `videos[]`, `currentIndex`
- `openFeed(videos, startIndex)` -- opens the overlay
- `closeFeed()` -- dismisses and restores scroll position
- Handles body scroll lock when feed is open
- Provides `onNavigateToArtist(artistId)` that closes feed, navigates, and preserves state for back-navigation

### Data Format

All entry points normalize their video data into a common interface:

```typescript
interface FeedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  artistId: string;
  artistUserId: string;
  artistName: string;
  artistAvatar: string | null;
}
```

---

## Part 3: Integration Points (One System, Every Entry Point)

### A. Feed Videos Tab (`src/components/feed/CompactVideoCard.tsx`)

- On card tap: open `FullScreenVideoFeed` with all Feed videos, starting at tapped index
- Remove current hover-to-play behavior on mobile (only desktop)
- Card remains as grid thumbnail with play icon overlay

### B. Artist Profile Videos (`src/components/artist/ArtistVideosSection.tsx`)

- Replace the existing `VideoFullscreenModal` (horizontal prev/next with Dialog) with `FullScreenVideoFeed`
- When `onOpenFullscreen(index)` is called, open the unified feed instead
- Pass the artist's videos array to the feed

### C. Discover Feed (`src/components/discover/DiscoverVideoCard.tsx`)

- Already has full-screen-like behavior with snap scrolling
- Integrate with the unified component to share the same UX patterns (action bar, artist overlay, like animation)

### D. Feed Videos Tab container (`src/components/feed/FeedVideosTab.tsx`)

- Pass video list and an `onVideoTap(index)` handler
- Handler opens `FullScreenVideoFeed`

---

## Part 4: State Preservation for Navigation

When user taps an artist name inside the full-screen feed:
1. Store current `feedState` (videos array, current index) in a React ref or context
2. Close the feed overlay
3. Navigate to `/artist/:userId` via `react-router-dom`
4. On browser back, the feed page re-renders with cached data -- no refetch needed since data is in React state

This avoids losing scroll position or triggering full page reloads.

---

## Part 5: Mobile-First Design Principles

- All touch targets are minimum 44x44px
- Swipe gestures use `scroll-snap` (native browser, no JS touch math needed)
- `100dvh` (dynamic viewport height) used to account for mobile browser chrome
- Video autoplay uses `muted playsInline` for iOS Safari compatibility
- Unmute prompt shown as floating button
- Close button is thumb-reachable (top-left or swipe-down gesture)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/video/FullScreenVideoFeed.tsx` | Main full-screen overlay with snap-scroll container |
| `src/components/video/FullScreenVideoItem.tsx` | Individual video slide with controls and overlays |
| `src/hooks/useFullScreenVideoFeed.ts` | State management hook for opening/closing the feed |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/artist/ArtistHeroSection.tsx` | Add `min-h-[280px]` safety net for mobile |
| `src/components/feed/CompactVideoCard.tsx` | On tap, open full-screen feed instead of inline play |
| `src/components/feed/FeedVideosTab.tsx` | Wire up `FullScreenVideoFeed` for all Feed videos |
| `src/components/artist/ArtistVideosSection.tsx` | Replace `VideoFullscreenModal` with unified feed |
| `src/components/artist/VideoCard.tsx` | On tap/play, trigger unified feed |

## Files to Remove (after migration)

| File | Reason |
|------|--------|
| `src/components/artist/VideoFullscreenModal.tsx` | Replaced by `FullScreenVideoFeed` |

---

## Acceptance Criteria

- Artist profile avatar and name are never clipped on mobile
- Tapping any video card (Feed, Artist, Discover) opens a full-screen vertical feed
- Swiping up/down navigates between videos with snap behavior
- Videos autoplay (muted) when visible, pause when scrolled away
- Thumbnails show immediately -- no black frames
- Artist name is visible and tappable to navigate to profile
- Navigating to an artist and pressing back returns to the feed (state preserved)
- Same experience across all entry points
- Mobile Safari (iOS) works correctly with `playsInline` and muted autoplay
- Desktop shows the same overlay (mouse scroll replaces swipe)
