

# Fix: Cover Image Aspect Ratio on Mobile Feed Cards

## Root Cause

Two issues combine to cause the stretched/cropped cover image on mobile:

### Issue 1: Global CSS `height: auto` on images

In `src/App.css` (line 3), we added a global reset:

```css
img, video, canvas { max-width: 100%; height: auto; display: block; }
```

While Tailwind's `.h-full` class (specificity 0,1,0) technically beats the element selector `img` (specificity 0,0,1), iOS Safari has known rendering quirks where `height: auto` and `object-cover` interact unpredictably inside flex containers. The `height: auto` tells the browser "use natural aspect ratio" which conflicts with `h-full` ("fill parent height"). Safari sometimes resolves this by stretching/elongating the image.

### Issue 2: No `overflow-hidden` on thumbnail wrapper

The thumbnail wrapper div:
```html
<div class="relative w-[60px] h-[60px] flex-shrink-0">
  <img class="w-full h-full rounded-lg object-cover" />
</div>
```

Without `overflow-hidden`, the image can visually bleed outside its 60x60 boundary. On Safari, this manifests as the image appearing taller than the container.

## Fix

### File 1: `src/App.css`

Remove `height: auto` from the global `img` rule. This was added as a "safety net" reset, but it actively conflicts with images that need explicit sizing (like our track covers). Keep `max-width: 100%` and `display: block` which are safe.

Before:
```css
img, video, canvas { max-width: 100%; height: auto; display: block; }
```

After:
```css
video, canvas { max-width: 100%; height: auto; display: block; }
img { max-width: 100%; display: block; }
```

This removes `height: auto` only from `img` elements, so images respect their explicit Tailwind height classes without interference. Videos and canvas elements keep `height: auto` since they typically need it.

### File 2: `src/components/TrackCard.tsx`

Add `overflow-hidden` to the thumbnail wrapper div so the image is clipped to the exact square boundary:

Before (line 102):
```
<div className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0">
```

After:
```
<div className="relative w-[60px] h-[60px] md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg">
```

Also move `rounded-lg` from the `<img>` and the overlay to the wrapper (single source of truth for border radius), and remove the redundant `rounded-lg` from child elements:

- `<img>`: remove `rounded-lg`, keep `w-full h-full object-cover`
- Play overlay div: remove `rounded-lg`, keep everything else
- Fallback (no cover) div: remove `rounded-lg`, keep everything else

This ensures the wrapper clips everything cleanly to a rounded square.

### File 3: `src/components/ui/skeletons/TrackCardSkeleton.tsx`

No changes needed -- the skeleton already uses `w-[60px] h-[60px] rounded-lg flex-shrink-0` on a Skeleton component (no nested image), so it matches perfectly. The skeleton is already correct.

## Files Summary

| File | Change |
|------|--------|
| `src/App.css` | Remove `height: auto` from `img` elements to stop conflicting with explicit Tailwind height classes |
| `src/components/TrackCard.tsx` | Add `overflow-hidden rounded-lg` to thumbnail wrapper; remove redundant `rounded-lg` from children |

## What's NOT Changing

- Thumbnail dimensions (stays 60x60 mobile, 64x64 desktop)
- Card layout, spacing, or sizing
- Skeleton dimensions (already correct)
- Tab behavior
- Desktop layout

