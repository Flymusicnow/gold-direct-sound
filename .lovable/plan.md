

# Fix: Track Cards Still Cut Off on Mobile Feed

## Root Cause

The TrackCard outer `div` is a flex row with no width constraint (`w-full`, `max-w-full`, or `overflow-hidden`). The combined minimum widths of its children are:

- Card padding: `px-3.5` = 28px
- Thumbnail: 60px + gap 14px = 74px
- Buttons: 2 x 36px + gap 10px = 82px + gap-to-text 14px = 96px
- **Total fixed width: ~198px**

On a 375px phone with 16px page padding on each side, the card gets 343px. After fixed elements, only ~145px remains for text -- which should fit. BUT the `flex` container has no `overflow-hidden`, and the combination of `min-h-[88px]`, padding, gaps, and button sizing can cause the row to push slightly wider than the parent, especially when border and sub-pixel rounding are involved.

The parent `motion.div` wrapper (from StaggeredList) also has no width constraint, so nothing prevents the card from overflowing.

## Fix (3 changes in 2 files)

### 1. TrackCard outer div -- add `w-full overflow-hidden`
This is the primary fix. Forces the card to respect its parent's width and clip any overflow internally.

**File:** `src/components/TrackCard.tsx` (line 98-99)

Before:
```tsx
className="group flex items-center gap-3.5 md:gap-4 px-3.5 py-3 md:p-4 min-h-[88px] md:min-h-0 rounded-[14px] bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer"
```

After:
```tsx
className="group flex items-center gap-3 md:gap-4 px-3 py-3 md:p-4 min-h-[88px] md:min-h-0 rounded-[14px] bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer w-full overflow-hidden"
```

Changes: adds `w-full overflow-hidden`, reduces mobile gap from `gap-3.5` to `gap-3`, and reduces mobile padding from `px-3.5` to `px-3` (saves ~5px total, prevents edge-case overflow on 320px screens).

### 2. Buttons container -- add `flex-shrink-0` and reduce mobile gap
The buttons wrapper needs `flex-shrink-0` so it keeps its size and lets only the text column shrink (which already has `min-w-0` and `truncate`).

**File:** `src/components/TrackCard.tsx` (line 145)

Before:
```tsx
<div className="flex items-center gap-2.5">
```

After:
```tsx
<div className="flex items-center gap-1.5 md:gap-2.5 flex-shrink-0">
```

Changes: adds `flex-shrink-0`, reduces mobile button gap from `gap-2.5` (10px) to `gap-1.5` (6px), saving 4px.

### 3. StaggeredList items -- add `overflow-hidden`
Each card is wrapped in a `motion.div` inside StaggeredList. Adding `overflow-hidden` ensures the animation wrapper also constrains its children.

**File:** `src/components/ui/StaggeredList.tsx` (line 61)

Before:
```tsx
<motion.div key={index} variants={itemVariants}>
```

After:
```tsx
<motion.div key={index} variants={itemVariants} className="overflow-hidden">
```

## Summary

| File | Change |
|------|--------|
| `src/components/TrackCard.tsx` | Add `w-full overflow-hidden` to card, reduce mobile gap/padding, add `flex-shrink-0` to buttons |
| `src/components/ui/StaggeredList.tsx` | Add `overflow-hidden` to motion.div wrapper |

These changes guarantee the card respects its container width on all viewport sizes (320px-414px). The text column absorbs all available space and truncates, while buttons and thumbnail keep their fixed sizes.

