

# Tighten Thread Indentation for Maximum Width

## Current State (already correct)

The avatar is already **inside** the comment card. The 3-row stacked layout is already implemented:
- Row 1: Avatar + Name + Badge + Timestamp (inline)
- Row 2: Content (full width)
- Row 3: Actions

## The Real Space Waster

The width loss comes from **nesting indentation**:
- Each reply level adds `ml-3` (12px)
- Thread connector lines sit at `-left-3` (another 12px visual offset)
- At depth 2: you lose ~24px of content width

## Proposed Fix

Reduce reply indent from 12px to 8px on mobile, and tighten thread connector lines to match.

### Changes to `src/components/community/CommentThread.tsx`

1. **Reduce mobile indent** from `ml-3` (12px) to `ml-2` (8px) per level:
   - Line 133: `depth <= 2 ? "ml-3"` becomes `depth <= 2 ? "ml-2"`

2. **Adjust thread connector lines** to match the tighter indent:
   - Line 138: `absolute -left-3` becomes `absolute -left-2` (vertical line)
   - Line 145: `absolute -left-3 top-4 w-2` becomes `absolute -left-2 top-4 w-1.5` (horizontal connector)

3. **Reduce card padding on mobile** from `p-4` (16px) to `p-3` (12px) on small screens:
   - Line 149: add responsive padding `p-3 sm:p-4`

This recovers ~8px per indent level + 8px padding = ~16px more content width on a 375px screen. Combined with the existing 2-level cap, replies stay compact and readable.

### File Summary

| File | Change |
|------|--------|
| `src/components/community/CommentThread.tsx` | Tighter mobile indent (ml-2), adjusted thread lines, responsive card padding |

