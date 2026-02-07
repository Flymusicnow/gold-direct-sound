

# Community Comments: Inline Avatar Layout for Mobile

## Problem

The current comment layout uses a two-column flex design:

```text
[Avatar] | [Name + Badge + Time]
         | [Comment text........]
         | [Like] [Reply]
```

On mobile, especially in nested replies (which add `ml-4` per depth level), the avatar column (32px + 12px gap) steals ~44px from the text area. This compresses comment threads into awkward narrow text blocks.

## Solution

Move the avatar into the name/metadata row so the comment text spans the full width:

```text
[Avatar] [Name] [Badge] [Time]
[Comment text fills full width..]
[Like] [Reply]
```

## Changes

### File: `src/components/community/CommentThread.tsx`

**1. Restructure `CommentItem` layout (lines 139-248)**

Change from a two-column `flex gap-3` layout to a single-column layout where:

- The avatar (reduced to `h-6 w-6`) moves inside the name/metadata row
- Comment text and actions sit directly below at full width
- The outer container changes from `flex gap-3` to a simple `space-y-1` block

**Current structure:**
```typescript
<div className="flex gap-3 py-3">
  <Avatar className="h-8 w-8 shrink-0">...</Avatar>
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      name, badge, time
    </div>
    <p>comment text</p>
    <div>actions</div>
  </div>
</div>
```

**New structure:**
```typescript
<div className="py-3 space-y-1">
  <div className="flex items-center gap-2 flex-wrap">
    <Avatar className="h-6 w-6 shrink-0">...</Avatar>
    name, badge, time
  </div>
  <p>comment text</p>
  <div>actions</div>
</div>
```

**2. Adjust nested reply indentation**

Reduce `ml-4 sm:ml-6` to `ml-3 sm:ml-4` since we no longer need as much indent to clear the avatar column. This further maximizes text width on mobile.

**3. Adjust thread connector positions**

Update the left-positioned thread lines (`-left-4 sm:-left-6`) to match the new, smaller indentation (`-left-3 sm:-left-4`, connector width `w-2 sm:w-3`).

## Files to Change

| File | Action |
|------|--------|
| `src/components/community/CommentThread.tsx` | Restructure comment layout to inline avatar |

## Acceptance Criteria

- Avatar appears inline with the author name, on the same row
- Comment text spans the full available width
- Nested replies remain visually threaded but with more text space
- Thread connector lines still align correctly
- Works on both mobile and desktop
- No changes to tab layout or navigation
