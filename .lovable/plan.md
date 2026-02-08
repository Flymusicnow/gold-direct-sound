

# Fix: "Play All" Button Clipped on Mobile Feed

## Problem

On mobile, too much vertical space is consumed before the actual content starts. Adding up all the elements above "Play All":

- Top nav bar: 64px
- Main content padding: 16px
- Breadcrumb (Home > Fan Portal > Feed): ~36px
- Sticky header top padding: 8px
- "Your Feed" title + spacing: ~72px
- Tabs bar: ~48px
- Sticky header bottom padding: 12px
- Content top padding: 16px

**Total: ~272px** before "Play All" even starts. On a ~700px phone viewport, the button is right at the edge, partially clipped.

## Solution (3 changes in 2 files)

### 1. Hide breadcrumb on mobile
**File:** `src/pages/FanFeed.tsx` (line 305)

The breadcrumb "Home > Fan Portal > Feed" is redundant on mobile because the bottom nav already highlights "Feed" as the active tab. Hiding it saves ~36px of vertical space.

Before:
```tsx
<PageBreadcrumb role="fan" />
```

After:
```tsx
<div className="hidden md:block">
  <PageBreadcrumb role="fan" />
</div>
```

### 2. Make the sticky header more compact on mobile
**File:** `src/pages/FanFeed.tsx` (line 334)

Reduce the title size and spacing on mobile to reclaim vertical space:

Before:
```tsx
<div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-3 border-b border-border/50 md:static md:z-auto md:bg-transparent md:backdrop-blur-none md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-b-0">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
    <div>
      <h1 className="text-3xl md:text-4xl font-bold mb-1">{t('fan.yourFeed')}</h1>
    </div>
  </div>
```

After:
```tsx
<div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-1 pb-2 border-b border-border/50 md:static md:z-auto md:bg-transparent md:backdrop-blur-none md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-b-0">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 md:gap-4 md:mb-3">
    <div>
      <h1 className="text-2xl md:text-4xl font-bold">{t('fan.yourFeed')}</h1>
    </div>
  </div>
```

Changes:
- `pt-2` to `pt-1` (saves 4px)
- `pb-3` to `pb-2` (saves 4px)
- `gap-4` to `gap-2 md:gap-4` (saves 8px on mobile)
- `mb-3` to `mb-2 md:mb-3` (saves 4px on mobile)
- `text-3xl` to `text-2xl md:text-4xl` (smaller title on mobile, saves ~8px)
- Remove `mb-1` from h1 (saves 4px)

### 3. Reduce content top padding on mobile
**File:** `src/pages/FanFeed.tsx` (line 349)

Before:
```tsx
<div className="pt-4 md:pt-5 grid lg:grid-cols-3 gap-6">
```

After:
```tsx
<div className="pt-2 md:pt-5 grid lg:grid-cols-3 gap-6">
```

Reduces the gap between the sticky header bottom border and the "Play All" button on mobile (saves 8px).

## Space Saved

| Change | Pixels saved |
|--------|-------------|
| Hide breadcrumb | ~36px |
| Reduce header padding/gaps | ~20px |
| Smaller title | ~8px |
| Reduce content padding | 8px |
| **Total** | **~72px** |

This pushes "Play All" and the first track card well into the visible viewport on all phone sizes (320px-414px wide, ~600-900px tall).

## Files Summary

| File | Change |
|------|--------|
| `src/pages/FanFeed.tsx` | Hide breadcrumb on mobile, compact sticky header spacing, reduce content top padding |

## What stays the same
- Desktop layout is unchanged (all changes use `md:` breakpoint to preserve desktop styles)
- The track card fixes from the previous change remain
- The sticky header behavior still works correctly
