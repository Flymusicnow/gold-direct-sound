

# Fix: Mobile Feed Content Container Height Bug

## Root Cause Analysis

The FanFeed page has **two completely separate render trees** -- one for loading (early return at line 299) and one for loaded (line 339). When `loading` flips from `true` to `false`, React **unmounts the entire loading DOM tree and mounts a new loaded tree**. This causes:

1. **Brief layout collapse** -- during the swap, the container momentarily has no content, causing the FlightdeckLayout scroll container to collapse to zero height before the new content renders
2. **PageTransition animation** -- the loaded state wraps content in a `motion.div` that starts at `opacity: 0, y: 8`. During this animation, the browser may not calculate dimensions correctly, resulting in the "squeezed" container
3. **`overflow-x-hidden` on the wrapper** -- unique to FanFeed (no other fan page has this). This creates a new block formatting context that can interact unpredictably with the parent FlightdeckLayout scroll container (`flex-1 min-h-0 overflow-y-auto`)
4. **`min-h-screen` (100vh) is unreliable on mobile Safari** -- iOS dynamically changes the viewport height as the address bar shows/hides, causing `100vh` to be larger than the visible area

### Layout chain on mobile
```text
html/body          -> height:100%, overflow:hidden
  #root            -> height:100%
    FlightdeckLayout -> h-screen, overflow-hidden, flex flex-col
      <main>       -> flex-1, min-h-0, overflow-y-auto  <-- scroll container
        FanFeed wrapper -> flex, min-h-screen, pt-16, overflow-x-hidden  <-- BUG SOURCE
          FanSidebar   -> hidden on mobile
          <main>       -> flex-1, p-4, pb-52
            content...
```

## Fix

### Strategy: Unified shell, content-only swap

Instead of two completely separate render trees, use a **single shared shell** for both loading and loaded states. Only the inner content changes. This eliminates the layout collapse during the loading-to-loaded transition.

### File: `src/pages/FanFeed.tsx`

**Changes:**

1. **Remove the early return** for loading state (lines 299-336). Instead, render one unified shell that always mounts, and conditionally render skeleton or real content inside it.

2. **Replace `min-h-screen` with `min-h-[100dvh]`** on the outer wrapper for proper mobile Safari dynamic viewport handling. Add a fallback via inline style for browsers that don't support `dvh`.

3. **Remove `overflow-x-hidden`** from the outer wrapper -- it's unnecessary (FlightdeckLayout already handles overflow) and creates formatting context issues.

4. **Move PageTransition inside the content area only**, not wrapping the entire shell. This prevents the animation from affecting the container dimensions.

### Before (two separate trees)
```text
if (loading) {
  return (
    <MobileFanNav />
    <div className="flex min-h-screen ...overflow-x-hidden">   <-- Tree A
      <FanSidebar />
      <main>...skeletons...</main>
    </div>
    <BottomNavBarFan />
  );
}

return (
  <MobileFanNav />
  <div className="flex min-h-screen ...overflow-x-hidden">     <-- Tree B (full unmount/remount)
    <FanSidebar />
    <main>
      <PageTransition>...content...</PageTransition>           <-- animation affects container
    </main>
  </div>
  <BottomNavBarFan />
);
```

### After (single shell, content swap)
```text
return (
  <MobileFanNav />
  <div className="flex w-full pt-16 min-h-[100dvh]">          <-- Single shell, no overflow-x-hidden
    <FanSidebar />
    <main className="flex-1 p-4 md:p-6 pb-52 md:pb-8">
      <PageBreadcrumb />
      <div className="max-w-7xl mx-auto space-y-5">
        {loading ? (
          ...skeletons...                                       <-- Same container, different content
        ) : (
          <PageTransition>...content...</PageTransition>        <-- Animation only on inner content
        )}
      </div>
    </main>
  </div>
  <BottomNavBarFan />
);
```

### Specific code changes:

1. Remove the entire `if (loading) { return (...) }` block (lines 299-336)
2. In the main return, wrap the content section in a conditional:
   - `loading === true`: render header skeleton + tabs skeleton + track card skeletons (same as before)
   - `loading === false`: render the header, FeedTabs, content grid inside PageTransition
3. Change outer wrapper class from `"flex min-h-screen w-full pt-16 overflow-x-hidden"` to `"flex w-full pt-16 min-h-[100dvh]"`
4. Add inline style `style={{ minHeight: '100dvh' }}` as the primary value (CSS property), with the Tailwind class as fallback

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/FanFeed.tsx` | Unify loading/loaded into single shell; replace `min-h-screen` with `min-h-[100dvh]`; remove `overflow-x-hidden`; conditional content instead of conditional return |

## Acceptance Criteria

- On mobile portrait, feed content fills the available viewport height consistently
- No "squeezed" or "compact" container on any tab (Music, Videos, Spotlight, Artists)
- Switching between tabs does not cause the content area to shrink
- Loading skeleton and loaded content have identical container sizing
- No large empty dead space caused by incorrect container height
- Desktop layout remains unchanged
