

# Fix: Align Real Track Rows to Match Skeleton Symmetry

## Problem

The skeleton rows and real track card rows use different sizing values, causing a visual "jump" when content loads and an uneven rhythm in the loaded list.

### Current Mismatches

| Property | Skeleton | Real Card (mobile) | Fix |
|----------|----------|-------------------|-----|
| Padding | `p-4` (16px) | `p-3` (12px) | Align to `p-3` |
| Gap | `gap-4` (16px) | `gap-3` (12px) | Align to `gap-3` |
| Thumbnail | `w-16 h-16` (64px) | `w-14 h-14` (56px) | Align to `w-14 h-14` |
| Right area | Single `h-9 w-9` circle | 3 buttons x `h-10 w-10` + `gap-2` | Skeleton gets 3 small circles |
| Row height | Implicit ~80px | Variable (description adds height) | Fixed `h-[68px]` on mobile |
| Description | Not present | Optional extra line | Hide on mobile via `hidden md:block` |
| Border | `border-border/50`, `bg-card/50` | `border-border`, `bg-card` | Align skeleton to match card |

## Changes

### File: `src/components/ui/skeletons/TrackCardSkeleton.tsx`

Update the skeleton to mirror the real card's structure exactly:

- Change padding from `p-4` to `p-3 md:p-4`
- Change gap from `gap-4` to `gap-3 md:gap-4`
- Change thumbnail from `w-16 h-16` to `w-14 h-14 md:w-16 md:h-16`
- Add a fixed height: `h-[68px] md:h-auto`
- Replace the single right-side circle with 3 small circles matching the 3 action buttons (ListMusic, Plus, Heart)
- Match border/bg to `border-border bg-card`

### File: `src/components/TrackCard.tsx`

Lock the real card row to a fixed height on mobile so all rows are uniform:

- Add `h-[68px] md:h-auto` to the outer container (same as skeleton)
- Hide the optional description on mobile: change `track.description &&` to render with `hidden md:block` so it never increases row height on mobile
- Ensure title uses `truncate` (already does) -- keep as-is
- Ensure artist name uses `truncate` (already does) -- keep as-is
- Tighten the right-side action buttons: reduce gap from `gap-2` to `gap-1` on mobile so buttons sit closer together, reducing right-side width
- Reduce icon sizes from `h-6 w-6` to `h-5 w-5` on mobile for tighter fit within the fixed row height

## Detailed Changes

### TrackCardSkeleton.tsx -- full replacement

```tsx
<div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 h-[68px] md:h-auto rounded-xl bg-card border border-border">
  <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex-shrink-0" />
  <div className="flex-1 min-w-0 space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
  <div className="flex items-center gap-1 md:gap-1 flex-shrink-0">
    <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
    <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
    <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
  </div>
</div>
```

### TrackCard.tsx -- specific changes

1. **Outer container** (line 99): add `h-[68px] md:h-auto`
2. **Description** (lines 134-138): add `hidden md:block` to prevent it from expanding row height on mobile
3. **Action button container** (line 142): change `gap-2 md:gap-1` to `gap-1`
4. **Action button sizes** (lines 146, 163, 176): change `h-10 w-10 md:h-9 md:w-9` to `h-9 w-9`
5. **Icon sizes** (lines 157, 170, 181): change `h-6 w-6 md:h-5 md:w-5` to `h-5 w-5`

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/skeletons/TrackCardSkeleton.tsx` | Match real card structure: same padding, gap, thumbnail size, 3 action circles, fixed height |
| `src/components/TrackCard.tsx` | Fixed row height on mobile, hide description on mobile, tighten action button spacing and icon sizes |

## Acceptance Criteria

- Skeleton rows and real rows have identical height and proportions on mobile
- All real rows are the same height regardless of content length (title, artist truncated)
- No layout jump when transitioning from skeleton to loaded state
- Right-side action icons (playlist, queue, heart) are always visible and tappable
- Desktop layout remains unchanged (responsive breakpoints handle it)
