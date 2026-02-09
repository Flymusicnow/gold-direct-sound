

# Smooth Feed Scrolling + Video Comments "Genie Pull"

Two features in one: fix the mobile scroll jank on the fan feed, and add a "genie pull" comment panel to the full-screen video viewer.

---

## Part 1: Smooth Mobile Scrolling

### What's wrong

On iOS Safari, horizontal tab swiping and vertical content scrolling can fight each other. The tabs container uses `overflow-x: auto` but has no `touch-action` directive, so the browser doesn't know which direction to prioritize. This causes stutter when switching from horizontal to vertical gesture.

### Changes

**File: `src/index.css`** (tabs-scrollable styles, ~line 83)
- Add `touch-action: pan-x pinch-zoom` to `.tabs-scrollable` so horizontal swipes are cleanly intercepted by the tab bar
- Add `will-change: scroll-position` for GPU compositing on scroll

**File: `src/components/ui/ScrollableTabs.tsx`** (~line 91)
- Add `touch-action: pan-x` style to the scrollable `<div>` to explicitly tell the browser this area only handles horizontal gestures
- This prevents the tab scroll from eating vertical scroll events

**File: `src/pages/FanFeed.tsx`** (~line 304)
- The `<main>` already has `touchAction: 'pan-y'` which is correct
- Add `-webkit-overflow-scrolling: touch` style for smoother inertial scrolling on older iOS versions

These are surgical CSS-only changes. No JS scroll listeners added.

---

## Part 2: Video Comments "Genie Pull" Panel

### Concept

A comment icon (the "Super Card" trigger) appears on the right side of the full-screen video feed, below the share button. Tapping it opens a bottom-sheet panel where comments emerge smoothly from below. Swiping down or tapping outside collapses it.

This reuses the existing `VideoCommentsSection` component (which handles fetching, posting, real-time subscriptions, replies, likes, etc.) but wraps it inside a new bottom-sheet overlay that lives inside each video item.

### New Component

**File: `src/components/video/VideoCommentSheet.tsx`** (new file)

A self-contained bottom-sheet for video comments:
- **Trigger**: A `MessageSquare` icon button on the right action bar (same style as heart/share)
- **Sheet**: A `motion.div` panel that slides up from bottom, `maxHeight: 55dvh`, with rounded top corners, dark translucent background + blur
- **Content**: Embeds the existing `VideoCommentsSection` component inside the scrollable area
- **Comment count**: Shown below the icon (like the like count)
- **Close**: Swipe down, tap backdrop, or tap close chevron
- **Gesture isolation**: The panel's scroll area uses `touch-action: pan-y` and `overscroll-behavior: contain` to prevent scroll from leaking to the video feed behind it
- When open, video controls (tap-to-pause) are blocked by the backdrop

Uses `framer-motion` for the slide-up animation (same pattern as `VideoCaption` expanded panel).

### Integration Changes

**File: `src/components/video/FullScreenVideoItem.tsx`**
- Import and render `VideoCommentSheet` in the right-side action bar, between the share button and the bottom caption
- Pass `videoId` and `artistId` to the sheet
- When the comment sheet is open, block tap-to-pause on the video (via a ref flag, similar to `captionExpandedRef`)

**File: `src/components/video/FullScreenVideoFeed.tsx`**
- Add a `commentSheetOpen` ref to track when comments are open, preventing swipe-to-close while the user scrolls comments
- Pass an `onCommentSheetChange` callback to each `FullScreenVideoItem`

### Comment Count Loading

**File: `src/components/video/VideoCommentSheet.tsx`**
- On mount, fetch comment count for the video from `video_comments` table
- Subscribe to real-time changes to update the count badge
- Display the count below the MessageSquare icon (same format as like count)

### Gesture Conflict Prevention

The comment sheet sits on top of the video and needs isolated scroll:
- The sheet's scrollable area: `overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y`
- The backdrop blocks all touch events from reaching the video
- The feed's swipe-to-close is disabled when the comment sheet is open (checked via ref)
- Swipe-down on the comment panel (deltaY > 60px) collapses the sheet

---

## Files Summary

| File | Change |
|------|--------|
| `src/index.css` | Add `touch-action: pan-x pinch-zoom` and `will-change: scroll-position` to `.tabs-scrollable` |
| `src/components/ui/ScrollableTabs.tsx` | Add `touch-action: pan-x` style to scrollable container |
| `src/pages/FanFeed.tsx` | Add `-webkit-overflow-scrolling: touch` to main element |
| `src/components/video/VideoCommentSheet.tsx` | **New** -- bottom-sheet with comment trigger icon, slide-up panel, embeds `VideoCommentsSection` |
| `src/components/video/FullScreenVideoItem.tsx` | Add comment icon to right action bar, render `VideoCommentSheet`, block tap-to-pause when sheet open |
| `src/components/video/FullScreenVideoFeed.tsx` | Track comment sheet state to disable swipe-to-close when open |

---

## Technical Details

### VideoCommentSheet anatomy

```text
+---------------------------+
|  [backdrop: black/50]     |  <-- tap to close
|                           |
|  +---------------------+  |
|  | [drag handle bar]   |  |  <-- swipe down to close
|  | Comments (5)        |  |
|  |---------------------|  |
|  | [scrollable list]   |  |  <-- overscroll-contain
|  |  Comment 1          |  |
|  |  Comment 2          |  |
|  |  ...                |  |
|  |---------------------|  |
|  | [input] [send btn]  |  |
|  +---------------------+  |
+---------------------------+
```

### Right action bar layout (video feed)

```text
  [Heart]  <-- existing
    123
  [Share]  <-- existing
  [Chat]   <-- NEW comment trigger
    5
```

### No database changes needed
The `video_comments` table already exists with all required columns (id, video_id, user_id, text, parent_comment_id, created_at, is_pinned, is_hidden). The existing `VideoCommentsSection` component handles all CRUD operations.

