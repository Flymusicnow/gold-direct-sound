

# Comments UI Overhaul -- Mobile + Desktop Unified

## Architecture Overview

Currently there are **two separate comment systems**:
1. **Community comments** (`CommentThread`, `CommentComposer`, `InlineComments`) for community posts
2. **Video comments** (`VideoCommentsSection`, `VideoCommentSheet`) for video posts

Both share the same problems: comments render inline inside narrow card containers, causing layout compression on mobile. The fix introduces a responsive presentation layer that wraps the existing thread/composer components.

## Solution: `CommentsPanel` -- One Component, Two Presentations

A single new component that uses `useIsMobile()` to pick the right container:
- **Mobile**: Vaul `Drawer` (bottom sheet) -- already in the project
- **Desktop**: Radix `Sheet` (right side panel, 480px) -- already in the project

Both wrap the **same** `CommentThread` + `CommentComposer` internals. No duplication.

```text
CommentsPanel (new)
  |
  +--> Mobile? --> Drawer (vaul, bottom sheet)
  |                  Header: post info + close
  |                  Body: CommentThread (scrollable)
  |                  Footer: CommentComposer (sticky)
  |
  +--> Desktop? --> Sheet side="right" (radix)
                     Header: post info + close
                     Body: CommentThread (scrollable)
                     Footer: CommentComposer (sticky)
```

## Files to Create

### 1. `src/components/community/CommentsPanel.tsx` (NEW)

Single responsive wrapper:
- Props: `postId`, `isOpen`, `onOpenChange`, `communityArtistUserId?`
- Uses `useIsMobile()` to choose Drawer vs Sheet
- Layout: flex column, header + scrollable thread + sticky footer composer
- Thread area: `overflow-y-auto`, `overscroll-behavior: contain`
- Footer: `sticky bottom-0` with `CommentComposer`
- Sheet width: `w-full sm:max-w-[480px]`

## Files to Modify

### 2. `src/components/community/PostCard.tsx`

Replace inline `InlineComments` expansion with `CommentsPanel`:
- Comment button opens `CommentsPanel` instead of toggling `isCommentsExpanded`
- Remove inline `InlineComments` render
- Keep inline preview of latest 2 comments (optional, can keep `InlineComments` in read-only preview mode without composer)

### 3. `src/components/community/CommentThread.tsx` -- Indentation Fix

Current indentation logic (lines 122-126):
```
depth === 1 && "ml-3 sm:ml-4"
depth >= 2 && "sm:ml-4"
```

Replace with capped indentation + thread line:
- `ml-3` for depth 1, `ml-3` for depth 2+ (cap at 12px * 2 = 24px max)
- Thread line (left border) always visible at all depths, including mobile
- Remove the `hidden sm:block` on thread lines for depth 2+ (lines 131, 140) -- these should always show

### 4. `src/components/community/CommentThread.tsx` -- Text Wrapping

Line 185 already has `break-words` which is correct. Add explicit guard:
```css
word-break: normal;
overflow-wrap: break-word;
```

### 5. `src/components/community/CommentThread.tsx` -- Actions Touch Targets

Lines 191-214: Like/Reply buttons use `h-7` (28px). Increase to `min-h-[44px] min-w-[44px]` on mobile for accessibility.

### 6. `src/components/community/InlineComments.tsx` -- Becomes Read-Only Preview

When used inside `PostCard`, it shows latest 2-3 comments as preview only (no composer). The composer moves to `CommentsPanel`. Add prop `showComposer?: boolean` (default false when used inline).

### 7. `src/components/community/PostDetail.tsx` -- Use CommentsPanel

The full post detail page also benefits: replace the inline `CommentThread` + `CommentComposer` at the bottom with `CommentsPanel` on desktop (or keep inline since PostDetail is already a full-width page -- optional, lower priority).

## Summary of Changes

| File | Action | What |
|------|--------|------|
| `src/components/community/CommentsPanel.tsx` | CREATE | Responsive wrapper: Drawer (mobile) / Sheet (desktop) |
| `src/components/community/PostCard.tsx` | EDIT | Comment button opens CommentsPanel instead of inline expand |
| `src/components/community/CommentThread.tsx` | EDIT | Cap indent at 24px, always show thread lines, 44px touch targets |
| `src/components/community/InlineComments.tsx` | EDIT | Add `showComposer` prop, default false for inline use |
| `src/components/community/CommentComposer.tsx` | EDIT | Minor: ensure `word-break: normal` on textarea wrapper |

## CSS Guardrails (applied in CommentThread)

- Thread container: `max-w-full w-full overflow-hidden`
- Comment text: `word-break: normal; overflow-wrap: break-word;` (already mostly correct)
- No `break-all` on comment content
- Indent: max `ml-6` (24px), thread line replaces deeper indentation
- Actions: `min-h-[44px]` touch targets on mobile

## What This Does NOT Change

- Video comment system (`VideoCommentSheet`) -- already uses a portal-based bottom sheet and works correctly
- `CommentsSection` (artist profile legacy comments) -- separate system, not in scope
- No new database tables or migrations needed

