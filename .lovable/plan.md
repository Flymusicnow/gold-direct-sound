# Fix Mobile Comment Layout -- Text Below Avatar

## Problem

From the screenshots: nested comments on mobile become unreadably narrow. The current layout places avatar + name + timestamp + content all in a horizontal arrangement within `min-w-0`. Combined with `ml-3` indentation per depth level, replies get squeezed into a ~60px wide column where text breaks word-by-word vertically.

## Root Cause

In `CommentThread.tsx` (lines 147-186), the comment body layout is:

```text
[Avatar] [Name] [Badge] [Timestamp]
[Content text -- constrained to same narrow column]
```

The content paragraph (line 184) sits inside a `min-w-0` div that inherits the remaining width after indentation. At depth 2+, this remaining width is tiny on a 375px screen.

## Solution

Change the `CommentItem` layout so on mobile the **content text renders full-width below the header row** (avatar + name + timestamp). This is a standard pattern used by Reddit, Twitter, and YouTube comments:

```text
[Avatar] [Name] [Timestamp]
[Content text -- full width of the comment container]
[Like] [Reply] [More]
```

### Changes to `src/components/community/CommentThread.tsx`

1. **Restructure the comment body** (lines 147-186): Change from a single `min-w-0` wrapper to a proper stacked layout:
  - Top row: Avatar + Name + Badge + Timestamp (horizontal, `flex items-center`)
  - Below: Content paragraph at full container width (not indented under avatar)
  - Below: Action buttons
2. **Reduce nested reply indentation on mobile**: Currently `ml-3` (12px) per level. The content is full-width within each level, so even with indentation the text has much more room. But cap at 2 levels max indent to be safe.

### Specific code change

Replace the inner layout block (lines 147-186) from:

```tsx
<div className="min-w-0">
  <div className="flex items-center gap-2 mb-1 flex-wrap">
    <Avatar>...</Avatar>
    <Name />
    <Badge />
    <Timestamp />
    <Menu />
  </div>
  <p>content</p>
</div>
```

To:

```tsx
<div className="min-w-0 w-full">
  <div className="flex items-center gap-2 mb-1 flex-wrap">
    <Avatar>...</Avatar>
    <Name />
    <Badge />
    <Timestamp />
    <Menu />
  </div>
  <p className="text-sm ... pl-0">content</p>
</div>
```

The key difference: ensure the content `<p>` tag has `pl-0` (no left padding that would align it under the avatar) and the outer container uses `w-full` to take all available space. The content text spans the full width of the comment container, not just the space to the right of the avatar.

3. **Also ensure the CommentsPanel drawer body** allows proper scrolling: the `bodyContent` div already uses `overflow-y-auto overscroll-contain`, which is correct. No changes needed there.

## Files to Change


| File                                         | What                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/components/community/CommentThread.tsx` | Restructure CommentItem inner layout so content text is full-width below avatar+name row, not squeezed beside it |


## Result

- Comments at any nesting depth will have readable text on mobile
- Avatar + name stay on one line as a compact header
- Content text uses the full available width below
- Thread lines and indentation still work but no longer squeeze content
- No changes to data model, CommentsPanel, or CommentComposer

&nbsp;

&nbsp;

---

We agree with the root cause analysis, but we are replacing the previous layout suggestion with a stricter implementation requirement.

Please implement the mobile comment layout exactly as follows. No alternative layouts.

1. On mobile, comment content text must render full width below the avatar/name row.
2. Content must never share horizontal space with the avatar.
3. Comment structure must be:
  - Row 1: Avatar + Name + Badge + Timestamp + Menu
  - Row 2: Content (full width)
  - Row 3: Actions (Like / Reply / More)
4. Indentation rules:
  - 12px per level
  - Maximum 24px total indent
  - Use thread-line for deeper nesting instead of increasing indent
5. Wrapping rules (mandatory):
  - Remove any `word-break: break-all`
  - Use `word-break: normal`
  - Use `overflow-wrap: break-word`
6. Every wrapper in the comment tree must enforce:
  - w-full
  - max-w-full
  - min-w-0
7. This change applies to mobile only.  
Desktop layout must remain unchanged.

Non-negotiable:  
No comment or reply may render as a narrow vertical column on a 375px screen.

Replace the previous layout suggestion with this implementation.

---