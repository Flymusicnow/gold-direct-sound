

# Fix: Comment Sheet Flashing on Video 2/3

## Root Cause

The `VideoCommentSheet` renders its fixed-position backdrop (z-120) and panel (z-130) as DOM children inside the snap-scroll container. When the sheet opens on video 2 or 3:

1. The backdrop covers the scroll container
2. This can interfere with the `IntersectionObserver` (threshold 0.6) or the snap-scroll mechanics
3. `isActive` briefly toggles, which unmounts the entire `VideoCommentSheet` (due to `{isActive && ...}`)
4. The sheet appears then immediately disappears -- the "flash"

Video 1 works because it's at the top of the scroll container and the observer is more stable there.

## Fix: Render the sheet overlay via a React Portal

Split the `VideoCommentSheet` into two parts:
- **Trigger button**: stays inline in the action bar (inside the scroll container)
- **Overlay (backdrop + panel)**: rendered via `createPortal(...)` to `document.body`, completely outside the scroll container

This way:
- The overlay never interferes with the scroll container or IntersectionObserver
- No event bubbling from the overlay reaches the video's tap handler
- The `isActive` guard can stay to control which trigger button is visible
- Even if `isActive` briefly flickers, the portal-rendered overlay is independent

## Changes (1 file)

### `src/components/video/VideoCommentSheet.tsx`

1. Import `createPortal` from `react-dom`
2. Wrap the `AnimatePresence` block (backdrop + panel) in `createPortal(..., document.body)`
3. The trigger button stays as-is (inline in the action bar)

This is a minimal, surgical change -- only the rendering target of the overlay changes.

## Technical Detail

```
Before:
  FullScreenVideoFeed (snap-scroll container)
    -> FullScreenVideoItem (100dvh)
      -> action bar (absolute, z-20)
        -> VideoCommentSheet
          -> trigger button (inline)
          -> backdrop (fixed, z-120)  <-- INSIDE scroll container
          -> panel (fixed, z-130)     <-- INSIDE scroll container

After:
  FullScreenVideoFeed (snap-scroll container)
    -> FullScreenVideoItem (100dvh)
      -> action bar (absolute, z-20)
        -> VideoCommentSheet
          -> trigger button (inline)

  document.body (via Portal)
    -> backdrop (fixed, z-120)  <-- OUTSIDE scroll container
    -> panel (fixed, z-130)     <-- OUTSIDE scroll container
```

