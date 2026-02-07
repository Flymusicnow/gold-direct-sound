

# Fix: Sticky Feed Header + Tabs on Mobile (Content-Only Scroll)

## Root Cause

The entire FanFeed page (header, tabs, and content) sits inside a single scrollable flow within `FlightdeckLayout`'s `<main>` scroll container (`overflow-y-auto`). There is no scroll separation -- when the user scrolls, everything moves together including the title and tab bar.

### Layout Chain (Current)

```text
FlightdeckLayout <main>  (overflow-y-auto -- THE scroll container)
  <div pt-16>            (FanFeed outer wrapper, clears fixed Navigation bar)
    <main p-4 pb-52>     (FanFeed inner main)
      <div max-w-7xl space-y-5>
        PageTransition    (motion.div with transform -- BREAKS sticky)
          Header          (title + DashboardFeedSwitch) -- scrolls away
          FeedTabs        (tabs) -- scrolls away
          Content Grid    (tracks/videos/etc) -- scrolls
```

### Two Critical Issues

1. **Header + tabs are inside `PageTransition`**: This component uses framer-motion's `transform` animation (`y: 8` to `y: 0`). CSS `transform` on a parent **breaks `position: sticky`** on all descendants. Even if we added `sticky` to the header, it would not work.

2. **No scroll separation**: Everything is in one flow with no sticky positioning applied to the header or tabs.

## Fix Strategy

1. Move the header + tabs **outside** `PageTransition` so they are not affected by the `transform` animation
2. Make the header + tabs container `sticky top-16` on mobile (sticks 64px from viewport top = right below the fixed Navigation bar)
3. Only wrap the content grid in `PageTransition`
4. Apply the same sticky structure to the skeleton/loading state to prevent layout jumps

### Layout Chain (Fixed)

```text
FlightdeckLayout <main>  (overflow-y-auto -- THE scroll container)
  <div pt-16>            (FanFeed outer wrapper)
    <main p-4 pb-52>     (FanFeed inner main)
      <div max-w-7xl>
        STICKY HEADER     (sticky top-16, z-20, bg-background) -- STAYS PUT
          Header + Tabs
        PageTransition    (only wraps content)
          Content Grid    -- scrolls past the sticky header
```

## Changes

### File: `src/pages/FanFeed.tsx`

**1. Remove `space-y-5` from the `max-w-7xl` wrapper**

The sticky header needs direct control over spacing. Replace `space-y-5` with manual spacing on child elements.

**2. Create a sticky header container (mobile-only)**

Wrap the header (title + DashboardFeedSwitch) and FeedTabs in a sticky container:

```
className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm
           -mx-4 px-4 pt-2 pb-3 border-b border-border/50
           md:static md:z-auto md:bg-transparent md:backdrop-blur-none
           md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-b-0"
```

Key details:
- `sticky top-16`: Sticks at 64px from scroll viewport top (below the fixed Navigation bar)
- `-mx-4 px-4`: Extends background edge-to-edge over the parent's padding on mobile
- `bg-background/95 backdrop-blur-sm`: Semi-transparent background with blur so content scrolling behind is subtly visible
- `border-b border-border/50`: Subtle bottom separator on mobile
- `md:static md:...`: Reverts to normal flow on desktop (no sticky behavior)

**3. Move header + tabs OUTSIDE PageTransition**

Before (broken for sticky):
```
<PageTransition>
  <Header />
  <FeedTabs />
  <ContentGrid />
</PageTransition>
```

After (sticky-compatible):
```
<StickyWrapper>
  <Header />
  <FeedTabs />
</StickyWrapper>
<PageTransition>
  <ContentGrid />
</PageTransition>
```

**4. Apply identical sticky structure to the skeleton/loading state**

The skeleton state must use the same wrapper so there is no layout jump when loading finishes:
```
<StickyWrapper>
  <Skeleton h-10 w-48 />  (header placeholder)
  <Skeleton h-12 />       (tabs placeholder)
</StickyWrapper>
<ContentSkeletons />
```

**5. Add top spacing to content area**

Since `space-y-5` is removed, add `pt-4 md:pt-5` to the content section below the sticky header.

### Summary of Classes

| Element | Mobile | Desktop |
|---------|--------|---------|
| Sticky wrapper | `sticky top-16 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-3 border-b border-border/50` | `static z-auto bg-transparent mx-0 px-0 pt-0 pb-0 border-b-0` |
| Content area | `pt-4` spacing below sticky header | `pt-5` normal spacing |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/FanFeed.tsx` | Remove `space-y-5`; extract header+tabs into sticky wrapper outside PageTransition; apply same structure to skeleton state; add content spacing |

No other files need changes. The `FeedTabs` component already passes `sticky={false}` to `ScrollableTabsList`, so it won't conflict. The `ScrollableTabsList` horizontal scroll will continue to work inside the sticky container.

## Acceptance Criteria

- On mobile, scrolling the feed list keeps the header title and tab bar pinned at the top
- Tabs remain horizontally scrollable within the sticky header
- Content scrolls freely beneath the sticky header
- No layout jump when switching between loading and loaded states
- No layout jump when switching tabs
- Desktop layout remains unchanged (no sticky behavior)
- The sticky header has a clean background so content doesn't show through awkwardly

