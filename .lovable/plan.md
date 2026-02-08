
# Fix: Cover + Play Overlay Still Clipping on iOS Safari (Nuclear Safari Workaround)

## Why Previous Fixes Haven't Worked

The code already has the correct structure: `overflow-hidden rounded-lg isolate` on the thumbnail wrapper. However, iOS Safari has a deeper compositing bug that `isolation: isolate` alone does not always resolve, particularly when the element is nested inside Framer Motion animated wrappers.

In this case, the rendering chain is:

```text
motion.div (StaggeredList item -- applies CSS transform during animation)
  -> div.group (TrackCard outer card)
    -> div.thumbnail-wrapper (overflow-hidden + rounded-lg + isolate)
        -> img (cover image)
        -> div.absolute.inset-0 (play overlay)
```

Framer Motion applies inline `transform: translateY(...)` and `will-change: transform` on the `motion.div` ancestor. On iOS Safari, this ancestor transform interferes with descendant `overflow: hidden` + `border-radius` clipping -- even when `isolation: isolate` is present. Safari's compositor does not always honor the clip path when a transform context exists further up the tree.

## The Fix: `-webkit-mask-image` (Bulletproof Safari Clipping)

The only 100% reliable workaround for this Safari bug is applying a webkit mask image on the thumbnail wrapper:

```css
-webkit-mask-image: -webkit-radial-gradient(white, black);
```

This forces Safari to use a pixel mask for clipping instead of relying on `overflow: hidden`. Masks always clip correctly regardless of ancestor transforms, compositing contexts, or stacking order. This is the standard workaround recommended across WebKit bug trackers and iOS development communities.

## Changes

### File: `src/components/TrackCard.tsx`

Add an inline style to the thumbnail wrapper div that applies the webkit mask:

Before:
```tsx
<div className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg isolate">
```

After:
```tsx
<div
  className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg isolate"
  style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
>
```

This single inline style addition forces Safari to rasterize the clipping boundary as a mask, ensuring:
- The cover image is clipped to the exact 60x60 rounded square
- The play overlay is fully contained and never bleeds outside
- Both work correctly even inside Framer Motion animated containers
- No visual difference on Chrome/Firefox (they already clip correctly)

No other files need changes. The skeleton already matches dimensions (60x60, rounded-lg, flex-shrink-0).

## Important Note About the Published Site

The screenshot shows `gold-direct-sound.lovable.app` (the published URL). The previous fixes (adding `isolate`, `overflow-hidden`, merging CSS into `index.css`) exist in the test/preview build but have NOT been published yet. After this fix is implemented, all accumulated fixes will need to be published together to appear on the live site.

## Files Summary

| File | Change |
|------|--------|
| `src/components/TrackCard.tsx` | Add `WebkitMaskImage` inline style to thumbnail wrapper for bulletproof Safari clipping |
