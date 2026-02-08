
# Apply Safari Webkit Mask Fix to All Thumbnail Components

## What the screenshot confirms

The feed page thumbnails now look correct with the webkit mask fix applied. The same clipping issue can affect any other component across the app that uses the same pattern: a rounded, overflow-hidden container with an image + absolute overlay inside it -- especially when rendered inside Framer Motion animated wrappers (StaggeredGrid, StaggeredList).

## Components that need the fix

After auditing 110+ files, here are the components that use the vulnerable pattern (image/video + absolute positioned overlay inside a rounded overflow-hidden container):

### High Priority (user-facing, likely inside animated containers)

| # | Component | Wrapper Element | Why it needs the fix |
|---|-----------|----------------|---------------------|
| 1 | `PremiumTrackCard.tsx` | `div.relative.w-20.h-20` (line 172) | Cover image + play overlay + lock overlay. No `overflow-hidden` or `isolate` on wrapper -- overlays use their own `rounded-lg` on each child which is even more fragile on Safari |
| 2 | `SearchTrackCard.tsx` | `div.w-16.h-16.rounded-lg.overflow-hidden` (line 34) | Cover image with hover scale transform (`group-hover:scale-105`). The scale transform itself can trigger the Safari compositing bug |
| 3 | `PreviewTrackList.tsx` | `div.relative.w-12.h-12.rounded.overflow-hidden` (line 35) | Cover image + absolute lock overlay on hover |
| 4 | `PreviewVideoGrid.tsx` | `div.relative.aspect-video.rounded-lg.overflow-hidden` (line 27) | Thumbnail + absolute overlay + absolute caption gradient |
| 5 | `CompactVideoCard.tsx` | `div.relative.aspect-[9/16].bg-muted` (line 90, inside outer `overflow-hidden rounded-xl`) | Video/thumbnail + play overlay. Outer card has overflow-hidden but the inner container holding overlays doesn't |
| 6 | `VideoCollectionCard.tsx` | `div.relative.aspect-video` (line 21, inside outer Card `overflow-hidden`) | Cover + hover play overlay. Relies on parent Card's overflow-hidden |
| 7 | `RecentlyAddedSection.tsx` | `div.relative` wrapping 12x12 img + absolute play overlay (line 165) | Small track thumbnail with hover play button |
| 8 | `PlaylistCard.tsx` | `div.w-16.h-16.rounded-lg.overflow-hidden` (line 31) | Cover image inside overflow container |
| 9 | `VideoCard.tsx` | `div.relative.rounded-2xl.overflow-hidden` (line 154) | Video + thumbnail + play overlay + locked overlay |
| 10 | `ComingSoonCard.tsx` | `div.relative.group.overflow-hidden.rounded-lg` (line 68) | Cover image + gradient overlay + lock overlay |
| 11 | `BannerUploadSection.tsx` | `div.rounded-lg.overflow-hidden.relative.group` (line 118) | Video banner + hover overlay |

### Lower Priority (admin/studio, not typically inside animated containers)

These are in studio/admin areas and less likely to be affected, but for consistency and future-proofing, they should also get the fix.

## The Fix

For each component, add `isolate` class and the `WebkitMaskImage` inline style to the container that has `overflow-hidden` and `rounded-*`:

```tsx
<div
  className="... overflow-hidden rounded-lg isolate"
  style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
>
```

For components where the wrapper is missing `overflow-hidden` (like `PremiumTrackCard`), add it along with the fix.

## Detailed Changes Per File

### 1. `src/components/artist/PremiumTrackCard.tsx` (line 172)
**Before:** `<div className="relative w-20 h-20 flex-shrink-0">`
**After:** `<div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`
Also remove individual `rounded-lg` from child elements (img, overlay divs) since the parent now handles clipping.

### 2. `src/components/search/SearchTrackCard.tsx` (line 34)
**Before:** `<div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer">`
**After:** `<div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 3. `src/components/artist/PreviewTrackList.tsx` (line 35)
**Before:** `<div className="relative w-12 h-12 rounded bg-muted overflow-hidden shrink-0">`
**After:** `<div className="relative w-12 h-12 rounded bg-muted overflow-hidden shrink-0 isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 4. `src/components/artist/PreviewVideoGrid.tsx` (line 27)
**Before:** `<div className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-not-allowed">`
**After:** `<div className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-not-allowed isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 5. `src/components/feed/CompactVideoCard.tsx` (line 84)
The outer card div already has `overflow-hidden rounded-xl`. Add the fix there:
**Before:** `<div className="group relative rounded-xl overflow-hidden bg-card border ...">`
**After:** `<div className="group relative rounded-xl overflow-hidden bg-card border ... isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 6. `src/components/video/VideoCollectionCard.tsx` (line 21)
**Before:** `<div className="relative aspect-video bg-gradient-to-br from-primary/5 to-primary/10">`
**After:** `<div className="relative aspect-video bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 7. `src/components/stacks/RecentlyAddedSection.tsx` (line 165)
**Before:** `<div className="relative">`
**After:** `<div className="relative overflow-hidden rounded isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 8. `src/components/playlists/PlaylistCard.tsx` (line 31)
**Before:** `<div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">`
**After:** `<div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 9. `src/components/artist/VideoCard.tsx` (line 154)
**Before:** `<div className="cursor-pointer group relative rounded-2xl overflow-hidden touch-manipulation interactive-card">`
**After:** `<div className="cursor-pointer group relative rounded-2xl overflow-hidden touch-manipulation interactive-card isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 10. `src/components/artist/ComingSoonCard.tsx` (line 68)
**Before:** `<div className="relative group overflow-hidden rounded-lg border bg-card">`
**After:** `<div className="relative group overflow-hidden rounded-lg border bg-card isolate" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

### 11. `src/components/studio/BannerUploadSection.tsx` (line 118)
**Before:** `<div className={`w-full ${aspectRatio} rounded-lg overflow-hidden relative group`}>`
**After:** `<div className={`w-full ${aspectRatio} rounded-lg overflow-hidden relative group isolate`} style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>`

## Files Summary

| File | Change |
|------|--------|
| `src/components/artist/PremiumTrackCard.tsx` | Add overflow-hidden, isolate, WebkitMaskImage to thumbnail wrapper; remove redundant rounded-lg from children |
| `src/components/search/SearchTrackCard.tsx` | Add isolate + WebkitMaskImage to thumbnail wrapper |
| `src/components/artist/PreviewTrackList.tsx` | Add isolate + WebkitMaskImage to cover art wrapper |
| `src/components/artist/PreviewVideoGrid.tsx` | Add isolate + WebkitMaskImage to video thumbnail wrapper |
| `src/components/feed/CompactVideoCard.tsx` | Add isolate + WebkitMaskImage to outer card container |
| `src/components/video/VideoCollectionCard.tsx` | Add overflow-hidden, isolate + WebkitMaskImage to video container |
| `src/components/stacks/RecentlyAddedSection.tsx` | Add overflow-hidden, rounded, isolate + WebkitMaskImage to thumbnail wrapper |
| `src/components/playlists/PlaylistCard.tsx` | Add isolate + WebkitMaskImage to cover wrapper |
| `src/components/artist/VideoCard.tsx` | Add isolate + WebkitMaskImage to video container |
| `src/components/artist/ComingSoonCard.tsx` | Add isolate + WebkitMaskImage to outer card |
| `src/components/studio/BannerUploadSection.tsx` | Add isolate + WebkitMaskImage to banner video wrapper |

## What's NOT Changing
- Avatar components (radix Avatar handles its own clipping with rounded-full)
- UI primitives (tooltip, select, toast, slider -- not image containers)
- Full-screen video players (no rounded clipping needed)
- TrackCard.tsx (already fixed)
