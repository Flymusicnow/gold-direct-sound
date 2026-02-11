

# Fix: Video Comments Not Working

## Root Cause

The `VideoCommentSheet` renders its fixed-position backdrop and panel as DOM children of the right-side action bar, which is itself a child of the main video container div that has `onClick={handleTap}`. This causes two problems:

1. **Taps on the comment trigger button** bubble up to the parent and fire `handleTap`, which triggers play/pause logic with a 300ms double-tap delay. This can swallow or interfere with the sheet opening.

2. **Taps inside the opened comment panel** (on the text input, send button, etc.) also bubble up through the fixed-positioned elements back to the parent's `handleTap`, causing the video to pause/play or triggering the double-tap like animation instead of interacting with the comment form.

## Fix

### File: `src/components/video/FullScreenVideoItem.tsx`

**Move `VideoCommentSheet` outside the action bar div** and render it as a direct child of the root container, but wrapped in its own `stopPropagation` container. This separates the trigger button (which stays in the action bar) from the sheet overlay.

Actually, the simpler fix: the `handleTap` callback on the root div needs to check if the event target is inside an interactive element before acting. But that's fragile.

The cleanest fix is to **stop propagation on the action bar div itself**, so no taps inside it (including comment trigger, like, share) ever reach the root `handleTap`. Currently each button does its own `stopPropagation`, but taps on children of the comment sheet (backdrop, panel, input) don't have this protection.

**Change 1**: Add `onClick={(e) => e.stopPropagation()}` to the action bar container div (line 270). This prevents ALL taps inside the action bar from reaching the root `handleTap`.

**Change 2**: Move the `VideoCommentSheet` component rendering **outside** the action bar div, as a sibling at the root level. The trigger button will remain inside the action bar (we'll split it). But actually this requires restructuring the component.

Simpler approach -- **just add stopPropagation to the action bar wrapper**:

```
<div 
  className="absolute right-3 bottom-36 ..."
  onClick={(e) => e.stopPropagation()}
  onTouchEnd={(e) => e.stopPropagation()}
>
```

This ensures that tapping the comment button, the like button, the share button, or anything inside the comment sheet panel doesn't trigger `handleTap` on the parent.

### File: `src/components/video/VideoCommentSheet.tsx`

**Add stopPropagation to the panel's touch events** to prevent any touch inside the comment panel from leaking up:

- On the panel `motion.div`: add `onTouchEnd={(e) => e.stopPropagation()}`
- On the scrollable content area: already has `onTouchStart` and `onTouchMove` stopPropagation, which is good

Also ensure the **textarea and send button inside `VideoCommentsSection`** are interactive. The `pointer-events-auto` classes are already there in the `VideoCommentsSection` component, which is correct.

## Summary

| File | Change |
|------|--------|
| `src/components/video/FullScreenVideoItem.tsx` | Add `onClick` and `onTouchEnd` stopPropagation to the action bar wrapper div |
| `src/components/video/VideoCommentSheet.tsx` | Add `onTouchEnd` stopPropagation to the panel motion.div |

This is a 2-line fix that prevents the parent tap handler from interfering with all interactive elements in the action bar and comment sheet.
