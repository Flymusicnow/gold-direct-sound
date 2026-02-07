

# Mobile Video Viewer: Swipe Exit + Caption Fade Preview + Poster Fix

## Overview

Three coordinated improvements to the full-screen video viewer (opened from /fan/feed) to deliver a premium, FlyMusic-native experience. No changes to tabs, feed layout, or desktop behavior.

---

## 1. Swipe Right to Exit Viewer

### Current State
The viewer uses vertical snap-scroll to navigate between videos. There is no horizontal swipe gesture. The X button and browser back button are the only ways to close.

### Implementation
Add a horizontal swipe gesture handler directly inside `FullScreenVideoFeed.tsx` (scoped to that overlay only, not the global `useSwipeGesture` hook).

- **Swipe RIGHT** (deltaX > 80px, and deltaX > deltaY): calls `onClose()` to exit the viewer and return to the feed grid. Feed scroll position is already preserved by the existing `useFullScreenVideoFeed` hook (body position lock + scrollTo restore).
- **Swipe LEFT**: No change needed. Currently there is no left-swipe-to-next behavior (vertical scroll handles navigation). Left swipe will be ignored to keep things simple -- vertical snap-scroll is the primary navigation method.
- The gesture listener attaches to the feed container element (not `document`) so it does not conflict with `SwipeBackProvider` or other global gestures.
- During the swipe, a subtle opacity/translateX animation provides visual feedback that the viewer is about to close (similar to iOS app-switch gesture).

### Edge Case: Caption Expanded
If the caption panel is expanded and the user swipes right:
- If the swipe is clearly horizontal (dx > dy and dx > threshold), exit the viewer (horizontal intent wins).
- If the swipe is more vertical, it collapses the caption instead.

### Files
- `src/components/video/FullScreenVideoFeed.tsx` -- add touch handlers for horizontal swipe-to-close with visual feedback

---

## 2. Caption Fade Preview + Tap-to-Expand

### Current State
Captions are rendered as a simple `line-clamp-2` paragraph at the bottom of each video item. No expand/collapse, no fade mask, no scrollable panel.

### Implementation -- New Component: `VideoCaption.tsx`

Create `src/components/video/VideoCaption.tsx` with a two-state caption system:

**State 1: COLLAPSED_PREVIEW (default)**
- Artist name row (avatar + name) always visible above the caption.
- Caption text: show first 2 lines clearly, then apply a CSS mask-image gradient fade from opaque to transparent over the remaining height.
- A small "More" text affordance appears when caption is longer than the preview area (detected via a ref comparing scrollHeight vs clientHeight).
- Preview area is NOT scrollable (pointer-events on text disabled beyond the mask).
- Tapping the caption area (or the "More" label) transitions to EXPANDED state.

**State 2: EXPANDED**
- A bottom-sheet-style panel slides up with `framer-motion` (gentle 300ms ease-out).
- Panel has a semi-transparent dark backdrop (`bg-black/70 backdrop-blur-sm`) for readability.
- Full caption text is scrollable inside the panel.
- Panel does NOT cover the close (X) button (max-height capped at ~60% of viewport).
- Artist name row is repeated at the top of the expanded panel for context.

**Collapse triggers:**
- Swipe DOWN on the expanded panel (touch delta Y > 60px downward).
- Tap outside the panel (on the backdrop area).
- The panel animates back down and returns to COLLAPSED_PREVIEW.

**CSS fade mask technique:**
```css
mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
-webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
```

### Integration into FullScreenVideoItem
- Replace the current bottom info section (artist row + caption paragraph) with the new `VideoCaption` component.
- Pass a `captionExpanded` state up so the parent swipe handler knows whether to prioritize caption collapse vs viewer exit.

### Files
- **Create**: `src/components/video/VideoCaption.tsx` -- new caption component with fade preview + expand/collapse
- **Modify**: `src/components/video/FullScreenVideoItem.tsx` -- replace bottom caption section with VideoCaption; expose `captionExpanded` state

---

## 3. Poster / Thumbnail: No Black Frames

### Current State
The `FullScreenVideoItem` already shows a thumbnail image while `videoReady` is false and hides the video with `opacity-0`. However:
- The `<video>` element does NOT have a `poster` attribute set, so if the thumbnail image fails to load or the state flips before the image renders, a black frame is visible.
- If `thumbnailUrl` is null, nothing is shown (pure black).

### Fix
- Always set `poster={video.thumbnailUrl || undefined}` on the `<video>` element as a secondary fallback.
- When `thumbnailUrl` is null, show a dark gradient placeholder (e.g., `bg-gradient-to-br from-gray-900 to-gray-800`) instead of pure black, with the artist's avatar centered as a visual anchor.
- Keep the existing thumbnail `<img>` overlay as the primary poster (it renders faster than the video poster attribute).

### Files
- **Modify**: `src/components/video/FullScreenVideoItem.tsx` -- add `poster` attribute to video element; add fallback placeholder when thumbnailUrl is null

---

## Technical Details

### Swipe-to-Close Gesture (FullScreenVideoFeed.tsx)

```text
Touch handlers on the container div:

onTouchStart:
  - Record startX, startY
  - Set directionLocked = null

onTouchMove:
  - Calculate deltaX, deltaY
  - If not locked: lock direction based on which delta is larger
  - If locked horizontal AND deltaX > 0 (rightward):
    - Set swipeDelta state for visual feedback
    - Apply transform: translateX(delta) and opacity: 1 - (delta/300) to container
  - If locked vertical: do nothing (let snap-scroll handle it)

onTouchEnd:
  - If horizontal AND deltaX > 80px: call onClose()
  - Else: animate back to original position (spring transition)
  - Reset state
```

### VideoCaption State Machine

```text
State: 'collapsed' | 'expanded'

COLLAPSED:
  - Render: artist row + masked caption (2 lines + fade)
  - Tap on caption -> set state to 'expanded'

EXPANDED:
  - Render: backdrop + scrollable panel with full caption
  - Swipe down on panel (deltaY > 60) -> set state to 'collapsed'
  - Tap backdrop -> set state to 'collapsed'
```

### Interaction Priority (FullScreenVideoItem)

```text
Tap on caption area    -> expand caption (stopPropagation, no play/pause toggle)
Tap on backdrop        -> collapse caption (stopPropagation)
Tap on video area      -> play/pause toggle (existing behavior)
Double-tap on video    -> like (existing behavior)
Horizontal swipe right -> exit viewer (FullScreenVideoFeed level)
Vertical scroll        -> next/prev video (snap-scroll, existing)
```

---

## Files Summary

| File | Action | Change |
|------|--------|--------|
| `src/components/video/VideoCaption.tsx` | Create | New caption component with fade preview, tap-to-expand, swipe-down-to-collapse |
| `src/components/video/FullScreenVideoItem.tsx` | Modify | Replace bottom caption with VideoCaption; add poster attribute; add fallback placeholder; expose captionExpanded state |
| `src/components/video/FullScreenVideoFeed.tsx` | Modify | Add horizontal swipe-right-to-close gesture with visual feedback (translateX + opacity) |

---

## Acceptance Criteria

- Swipe right on the viewer exits back to /fan/feed with scroll position preserved
- X button continues to work as before
- Caption shows first 1-2 lines clearly with a smooth fade-to-transparent gradient
- "More" affordance visible when caption is long
- Tapping caption expands a scrollable bottom panel with the full text
- Swipe down or tap outside collapses the panel back to faded preview
- Caption panel does not cover the X button or action buttons (like/share)
- No black frames: poster/thumbnail visible before video plays; fallback gradient when no thumbnail exists
- Works on iPhone Safari with no jank or layout jumps
- Desktop behavior unchanged

