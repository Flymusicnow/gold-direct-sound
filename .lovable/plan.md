
# Fix: Comment Thread Compression + Profile Picture Clipping on Mobile

## Problem 1: Comment Threads Too Narrow on Deep Nesting

Each reply depth adds `ml-3` (12px). At depth 3 that's 36px of accumulated indent, leaving text squeezed into narrow columns where words wrap one-by-one (visible in screenshots).

### Fix

Cap indentation at 1 level on mobile. Depth 2+ replies get no additional mobile indent (still indent on desktop for visual hierarchy). Thread connector lines are adjusted accordingly.

**File:** `src/components/community/CommentThread.tsx`

Current (line 122-124):
```typescript
depth > 0 && "ml-3 sm:ml-4"
```

New logic:
```typescript
depth === 1 && "ml-3 sm:ml-4",
depth >= 2 && "sm:ml-4"  // No mobile indent beyond depth 1
```

Thread connector lines also adjusted so they only show the left border / connector when there is actual indentation (skipped for depth 2+ on mobile).

---

## Problem 2: Artist Profile Picture Clipped on Mobile

The banner uses `aspect-[3/1]` = ~125px on a 375px screen. The avatar (96px) plus text content stacks vertically via `flex-col` on mobile, positioned `absolute bottom-0`. The total height exceeds the banner, so the avatar extends above and gets hidden behind the fixed navbar.

### Fix

Make the mobile banner taller by changing the aspect ratio from `aspect-[3/1]` to `aspect-[5/2]` on mobile. This gives ~150px on a 375px screen -- enough room for the avatar to sit within the visible area.

**File:** `src/components/artist/ArtistHeroSection.tsx`

Change (line 93):
```
aspect-[3/1] md:aspect-[4/1]
```
to:
```
aspect-[5/2] md:aspect-[4/1]
```

Also apply the same change to the gradient fallback (line 113).

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/community/CommentThread.tsx` | Cap mobile nesting indent at 1 level |
| `src/components/artist/ArtistHeroSection.tsx` | Widen mobile banner aspect ratio |

---

## Acceptance Criteria

- Comment threads at depth 2+ are readable on mobile (no single-word line wrapping)
- Desktop comment threading retains multi-level indentation
- Thread connector lines remain aligned
- Artist profile picture is fully visible on mobile, not clipped by the navbar
- No changes to desktop hero layout
