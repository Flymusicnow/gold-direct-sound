

# Super Card Fix Pack: Bigger Cards + No Horizontal Scroll + Stable Spacing

## What's Already Done

Two of the five items in this fix pack are **already implemented** from the previous changes:

| Item | Status |
|------|--------|
| Sticky top tabs | Already done (sticky header wrapper in FanFeed.tsx) |
| Bottom nav stable spacing | Already done (pb-52 on mobile, fixed bottom nav) |
| Bigger feed cards | **Needs work** |
| No horizontal page scroll | **Needs work** |
| Global box-sizing / image sanity | **Needs work** |

## Changes

### 1. Bigger Feed Cards (TrackCard + TrackCardSkeleton)

Currently cards use `h-[68px]` on mobile with `w-14 h-14` (56px) thumbnails and tight spacing. The fix pack asks for a more premium, spacious feel.

**Current vs Target:**

| Property | Current (mobile) | Target |
|----------|-----------------|--------|
| Card height | `h-[68px]` (fixed) | `min-h-[88px]` (flexible floor) |
| Thumbnail | `w-14 h-14` (56px) | `w-[60px] h-[60px]` (60px) |
| Inner gap | `gap-3` (12px) | `gap-3.5` (14px) |
| Padding | `p-3` (12px) | `px-3.5 py-3` (14px h / 12px v) |
| Border radius | `rounded-xl` (12px) | `rounded-[14px]` (14px) |
| Title size | `text-base` (16px) | `text-base` (16px) -- keep |
| Subtitle size | `text-sm` (14px) | `text-[13px]` (13px) |
| Action button gap | `gap-1` (4px) | `gap-2.5` (10px) |

Key decisions:
- Switch from fixed `h-[68px]` to `min-h-[88px]` so the card has a generous floor but can still breathe if content needs it (won't break layout since text is still truncated)
- Slightly larger thumbnails (60px square) for a more premium feel
- Wider action button gap (10px) so tapping targets are more comfortable

**Files:**
- `src/components/TrackCard.tsx` -- update card container, thumbnail, gap, text, action sizing
- `src/components/ui/skeletons/TrackCardSkeleton.tsx` -- mirror the same dimensions exactly

### 2. Feed List Spacing

The track list in `FeedMusicTab.tsx` currently uses `space-y-2` (8px gap between cards). The fix pack specifies 14px gap.

**File:** `src/components/feed/FeedMusicTab.tsx`
- Change `space-y-2` to `space-y-3.5` (14px) on the StaggeredList

### 3. No Horizontal Page Scroll

The app uses `FlightdeckLayout` as the root shell where `<main>` is the scroll container with `overflow-y-auto`. There is no `overflow-x` constraint on it, so wide content (e.g., full-bleed elements, or the sticky header's `-mx-4` trick) can cause a horizontal scroll.

**Fix approach -- two layers:**

**A) Global CSS (App.css):** Add `overflow-x: hidden` to the root scroll containers and a universal `box-sizing: border-box` reset. Also add `max-width: 100%` defaults for media elements (img, video, canvas).

**B) FlightdeckLayout.tsx:** Add `overflow-x-hidden` to the `<main>` scroll container so no child can cause horizontal expansion.

**C) FanFeed.tsx:** Add `overflow-x-hidden` to the page content wrapper as a belt-and-suspenders safeguard.

**Files:**
- `src/App.css` -- add box-sizing reset, media max-width, and `overflow-x: hidden` on body
- `src/components/flightdeck/FlightdeckLayout.tsx` -- add `overflow-x-hidden` to `<main>`
- `src/pages/FanFeed.tsx` -- add `overflow-x-hidden` to the outer feed wrapper

### 4. Touch-action Constraint

Add `touch-action: pan-y` on the feed page's main content area so horizontal page-level dragging is blocked on mobile (only vertical scroll allowed). This prevents accidental sideways page drags on iOS Safari.

**File:** `src/pages/FanFeed.tsx` -- add inline `style={{ touchAction: 'pan-y' }}` to the feed content main element

## Technical Details

### TrackCard.tsx Changes

```
Outer container:
  Before: gap-3 md:gap-4 p-3 md:p-4 h-[68px] md:h-auto rounded-xl
  After:  gap-3.5 md:gap-4 px-3.5 py-3 md:p-4 min-h-[88px] md:min-h-0 rounded-[14px]

Thumbnail:
  Before: w-14 h-14 md:w-16 md:h-16
  After:  w-[60px] h-[60px] md:w-16 md:h-16

Title:
  Before: text-base md:text-sm
  After:  text-base md:text-sm font-bold (change from font-semibold to font-bold = 700)

Subtitle (artist name):
  Before: text-sm md:text-xs
  After:  text-[13px] md:text-xs opacity-80

Action buttons container:
  Before: gap-1
  After:  gap-2.5
```

### TrackCardSkeleton.tsx Changes

Mirror every dimension change from TrackCard so skeleton-to-real transitions remain seamless:

```
Container: gap-3.5 md:gap-4 px-3.5 py-3 md:p-4 min-h-[88px] md:min-h-0 rounded-[14px]
Thumbnail skeleton: w-[60px] h-[60px] md:w-16 md:h-16
Action circles: gap-2.5
```

### App.css Additions

```css
*, *::before, *::after { box-sizing: border-box; }
img, video, canvas { max-width: 100%; height: auto; display: block; }
```

Note: `overflow: hidden` already exists on html/body in App.css, which includes both x and y. The FlightdeckLayout's `<main>` handles vertical scroll, so this is fine. The additional `overflow-x-hidden` on `<main>` is the key fix.

### FlightdeckLayout.tsx Change

Add `overflow-x-hidden` to the `<main>` className:

```
Before: "flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide"
After:  "flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-auto-hide"
```

## Files Summary

| File | Change |
|------|--------|
| `src/components/TrackCard.tsx` | Bigger card: min-h-[88px], 60px thumb, gap-3.5, rounded-[14px], bolder title, wider action gap |
| `src/components/ui/skeletons/TrackCardSkeleton.tsx` | Mirror all card dimensions for seamless skeleton-to-real transition |
| `src/components/feed/FeedMusicTab.tsx` | Increase list gap from space-y-2 to space-y-3.5 (14px) |
| `src/App.css` | Add box-sizing reset and media max-width defaults |
| `src/components/flightdeck/FlightdeckLayout.tsx` | Add overflow-x-hidden to main scroll container |
| `src/pages/FanFeed.tsx` | Add overflow-x-hidden and touch-action: pan-y to feed wrapper |

## What's NOT Changing

- Tab design / interaction (already sticky, already horizontally scrollable)
- Bottom nav positioning (already fixed with safe-area padding)
- Desktop layout (all mobile changes use responsive breakpoints)
- Feed page structure (no redesign)

