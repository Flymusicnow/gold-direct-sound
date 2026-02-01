
# Deep Debug: Why Centering Fails on Mobile

## Root Cause Analysis

Looking at the code structure in `NowPlayingScreen.tsx` (lines 362-374):

```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  className="... overflow-hidden ..."
>
  <SyncedLyricsDisplay className="h-72" />
</motion.div>
```

**The Problem Chain:**

1. Parent `motion.div` animates from `height: 0` → `height: auto`
2. Framer Motion spring animation with default timing takes **300-500ms** to complete
3. Our timeout is only **50ms** - animation is still in progress!
4. When we calculate `containerRect.height`, the parent is only ~50px tall (mid-animation)
5. Our check `if (containerRect.height === 0)` doesn't catch partial heights like 50px
6. Scroll calculation runs with wrong container dimensions → centering fails

```text
Timeline:
  0ms: showLyrics=true, motion.div starts animating
  0ms: SyncedLyricsDisplay mounts, useEffect schedules
 50ms: setTimeout fires (animation at ~15% complete)
 52ms: RAF 1 fires
 54ms: RAF 2 fires - container height is ~50px, NOT 288px!
       → scrollOffset calculated incorrectly
       → scroll happens to wrong position
300ms: Animation completes (too late, we already scrolled wrong)
```

## The Fix

### 1. Increase Timeout to 300ms (Wait for Animation)

Framer Motion's default spring takes ~300ms. We need to wait for it.

### 2. Add Container Height Validation

Check that container is actually at expected height before scrolling:

```typescript
// h-72 = 288px, allow some tolerance
if (containerRect.height < 200) return;
```

### 3. Add Retry Mechanism

If animation not complete, schedule another attempt:

```typescript
// If container not ready, retry in 100ms
if (containerRect.height < 200) {
  const retryId = setTimeout(scrollToCenter, 100);
  return () => clearTimeout(retryId);
}
```

## Technical Changes

### File: `src/components/flightdeck/SyncedLyricsDisplay.tsx`

```typescript
// Robust auto-scroll - always center active line (mobile compatible)
useEffect(() => {
  if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
  
  const scrollToCenter = () => {
    const container = scrollContainerRef.current;
    const activeLine = activeLineRef.current;
    if (!container || !activeLine) return;
    
    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    
    // Skip if container not fully expanded (animation still running)
    // h-72 = 288px, but check for at least 200px to be safe
    if (containerRect.height < 200) {
      // Retry in 100ms
      setTimeout(scrollToCenter, 100);
      return;
    }
    
    const scrollOffset = lineRect.top - containerRect.top - 
      (containerRect.height / 2) + (lineRect.height / 2);
    
    container.scrollTo({
      top: container.scrollTop + scrollOffset,
      behavior: 'smooth'
    });
  };
  
  // Wait 300ms for Framer Motion animation to complete + double RAF
  const timeoutId = setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToCenter();
      });
    });
  }, 300);
  
  return () => clearTimeout(timeoutId);
}, [currentLineIndex, isSynced]);
```

## Key Changes Summary

| Issue | Fix |
|-------|-----|
| 50ms too short for animation | Increase to 300ms |
| `height === 0` check too strict | Check `height < 200` |
| No retry if animation not done | Add retry with 100ms delay |
| Function not reusable | Extract `scrollToCenter` function |

## Files to Edit

1. `src/components/flightdeck/SyncedLyricsDisplay.tsx` - Robust timing + retry mechanism
