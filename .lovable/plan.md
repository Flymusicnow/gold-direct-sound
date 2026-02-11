# Implement exactly as spec. Do not use right-side sheet for comments on desktop. Mobile comments must be drawer/fullscreen with sticky composer.Comments UX: Mobile = Reddit, Desktop = Facebook

## Current State vs Target


| &nbsp;      | Current                   | Target                                                     |
| ----------- | ------------------------- | ---------------------------------------------------------- |
| **Mobile**  | Bottom drawer with thread | Same drawer, more Reddit-like (collapse, "view more")      |
| **Desktop** | Right side Sheet panel    | Facebook-style: inline under post, always-visible composer |


## Architecture

Same data layer (`CommentThread`, `CommentComposer`, `CommentItem`). The `PostCard` uses `useIsMobile()` to pick the presentation:

```text
PostCard
  |
  +--> Mobile? --> Comment button opens CommentsPanel (Drawer, Reddit-style)
  |                  - Sticky composer at bottom
  |                  - Collapsible replies
  |                  - "View X more replies" gating
  |
  +--> Desktop? --> Comment button toggles inline section (Facebook-style)
                     - InlineComments expands below the post card
                     - CommentComposer always visible at bottom
                     - Reply composer appears inline under each comment
```

## Changes

### 1. `src/components/community/PostCard.tsx`

Split behavior by breakpoint:

- Import `useIsMobile`
- Add `isCommentsExpanded` state (for desktop inline toggle)
- **Mobile**: Comment button opens `CommentsPanel` (drawer) -- same as now
- **Desktop**: Comment button toggles `isCommentsExpanded`, which renders `InlineComments` below the card footer with full composer
- Remove `CommentsPanel` render on desktop (Sheet is no longer used for comments)

### 2. `src/components/community/InlineComments.tsx`

Already has the right structure for Facebook-style. Minor updates:

- Add `showComposer` prop (default `true`) so it can be used as read-only preview if needed
- Add "Reply" button per comment that opens an inline reply composer under that comment (Facebook pattern)
- Add `onViewAll` handler that, on desktop, can expand to show all comments instead of navigating away
- Ensure composer is always visible when `showComposer` is true (Facebook "Write a comment..." feel)

### 3. `src/components/community/CommentsPanel.tsx`

Keep as-is for mobile (Drawer). Remove Sheet branch since desktop no longer uses it. This simplifies the component to mobile-only.

Alternatively, keep the Sheet branch but only render CommentsPanel on mobile in PostCard. The component itself stays unchanged for reuse elsewhere.

Decision: Keep component unchanged, just don't render it on desktop in PostCard. Simpler, no risk of breaking other consumers.

### 4. `src/components/community/CommentThread.tsx`

Add "View X more replies" gating:

- New prop: `defaultVisibleReplies?: number` (default 2)
- Each `CommentItem` shows only `defaultVisibleReplies` replies initially
- "View X more replies" button expands the rest
- Collapse toggle already exists -- keep it

### 5. `src/components/community/PostDetail.tsx`

Already has inline comments (Facebook-style) with `CommentThread` + `CommentComposer`. No changes needed -- this page is already correct for the desktop pattern.

## File Summary


| File                                          | Action    | What                                                                   |
| --------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `src/components/community/PostCard.tsx`       | EDIT      | Breakpoint split: mobile opens drawer, desktop toggles inline comments |
| `src/components/community/InlineComments.tsx` | EDIT      | Add `showComposer` prop, inline reply support per comment              |
| `src/components/community/CommentThread.tsx`  | EDIT      | Add "View X more replies" gating with `defaultVisibleReplies` prop     |
| `src/components/community/CommentsPanel.tsx`  | NO CHANGE | Kept as-is, only rendered on mobile                                    |


## Key Details

**Desktop inline comment section** renders inside the Card, after the footer actions bar:

- Full `InlineComments` component with composer always visible
- Clicking "Reply" on a comment shows inline reply composer under that comment
- "View all X comments" expands the thread (no navigation away)

**Mobile drawer** stays Reddit-like:

- Full-height drawer (85dvh)
- Sticky composer at bottom
- Thread with collapse/expand and "View more replies"
- Thread lines for nesting visualization

**Global CSS rules** (already applied from previous overhaul):

- `word-break: normal`, `overflow-wrap: break-word`
- Indent cap at 24px (ml-3 per level, max 2 levels)
- Touch targets 44px minimum
- Thread lines always visible

## No database changes needed

All data is shared. The only difference is presentation layer routing via `useIsMobile()`.