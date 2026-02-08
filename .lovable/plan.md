

# Fix: Cover + Play Overlay Clipping on iOS Safari

## Root Cause

The thumbnail wrapper in `TrackCard.tsx` already has the correct structure:
- Fixed dimensions: `w-[60px] h-[60px]`
- `overflow-hidden rounded-lg`
- `position: relative`
- Play overlay uses `absolute inset-0` (fully contained)

The DOM nesting is correct. The issue is a **well-known iOS Safari rendering bug** where `overflow: hidden` combined with `border-radius` fails to clip absolutely positioned descendants. Safari does not always create a compositing layer for the clipping parent, so the overlay and image can visually "escape" the rounded, clipped bounds.

This bug is documented across WebKit and only manifests on iOS Safari (not desktop Safari or Chrome mobile). It explains why the Lovable preview (Chrome-based iframe) looks fine while external Safari preview shows clipping.

## Fix

Add `isolation: isolate` to the thumbnail wrapper. This forces Safari to create a new stacking context and compositing layer, which makes `overflow: hidden` + `border-radius` reliably clip all positioned children.

In Tailwind, this is the `isolate` utility class.

### File: `src/components/TrackCard.tsx`

Line 102, the thumbnail wrapper:

Before:
```
<div className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg">
```

After:
```
<div className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg isolate">
```

One class added: `isolate`. This maps to `isolation: isolate` in CSS, which:
- Creates a new stacking context (prevents z-index leaking)
- Forces Safari to composite the element as a unit
- Makes `overflow: hidden` + `border-radius` reliably clip the `absolute inset-0` overlay inside

No other changes needed. The image (`w-full h-full object-cover`) and overlay (`absolute inset-0`) are already correctly structured.

## Files Summary

| File | Change |
|------|--------|
| `src/components/TrackCard.tsx` | Add `isolate` class to thumbnail wrapper div (line 102) |

## What's NOT Changing

- Thumbnail dimensions (60x60 mobile, 64x64 desktop)
- Image fitting (object-cover)
- Overlay structure or play button styling
- Skeleton dimensions (already correct at 60x60)
- Global CSS (index.css)
- Card layout, spacing, or border radius

