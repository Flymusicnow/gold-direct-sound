
# Plan: Robust Mobile Lyrics Centering (Final Fix)

## Root Cause Analysis

The centering fails because:

1. **Animation Timing**: Parent `motion.div` animates `height: 0 → auto`. Our `requestAnimationFrame` fires BEFORE the animation completes
2. **Container dimensions are 0**: When useEffect runs, container might still be at `height: 0`
3. **Single RAF not enough**: One `requestAnimationFrame` isn't enough to wait for Framer Motion's animation to finish

## Solution

### 1. Use Double `requestAnimationFrame` + Small Delay

Double RAF ensures browser has painted, and a small timeout ensures Framer Motion animation has completed:

```typescript
useEffect(() => {
  if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
  
  // Wait for Framer Motion animation to complete (~300ms)
  const timeoutId = setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        const activeLine = activeLineRef.current;
        if (!container || !activeLine) return;
        
        const containerRect = container.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        
        // Only scroll if container has height (animation complete)
        if (containerRect.height === 0) return;
        
        const scrollOffset = lineRect.top - containerRect.top - 
          (containerRect.height / 2) + (lineRect.height / 2);
        
        container.scrollTo({
          top: container.scrollTop + scrollOffset,
          behavior: 'smooth'
        });
      });
    });
  }, 50); // Small delay for animation
  
  return () => clearTimeout(timeoutId);
}, [currentLineIndex, isSynced]);
```

### 2. Add Initial Scroll on Mount

When lyrics panel opens, scroll to active line immediately:

```typescript
// Track when component mounts to do initial scroll
const initialScrollDone = useRef(false);

useEffect(() => {
  // Reset on new lyrics
  initialScrollDone.current = false;
}, [lyrics]);
```

### 3. Ensure Container Has Explicit Height

The className `h-72` should work, but let's ensure it's applied to the scrollable container:

```tsx
<div 
  ref={scrollContainerRef}
  className={cn("overflow-y-auto", className)} // h-72 from className
>
```

## Technical Changes

### File: `src/components/flightdeck/SyncedLyricsDisplay.tsx`

```typescript
// Robust auto-scroll - always center active line (mobile compatible)
useEffect(() => {
  if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
  
  // Small delay to ensure parent animation completes + double RAF for layout stability
  const timeoutId = setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        const activeLine = activeLineRef.current;
        if (!container || !activeLine) return;
        
        const containerRect = container.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        
        // Skip if container not yet visible (animation not complete)
        if (containerRect.height === 0) return;
        
        const scrollOffset = lineRect.top - containerRect.top - 
          (containerRect.height / 2) + (lineRect.height / 2);
        
        container.scrollTo({
          top: container.scrollTop + scrollOffset,
          behavior: 'smooth'
        });
      });
    });
  }, 50);
  
  return () => clearTimeout(timeoutId);
}, [currentLineIndex, isSynced]);
```

## Summary

| Change | Why |
|--------|-----|
| `setTimeout(50ms)` | Wait for Framer Motion animation |
| Double `requestAnimationFrame` | Ensure browser has painted |
| Guard `containerRect.height === 0` | Skip scroll if animation not done |
| Cleanup with `clearTimeout` | Prevent memory leaks |

## File to Edit

1. `src/components/flightdeck/SyncedLyricsDisplay.tsx` - Add delayed scroll with double RAF
