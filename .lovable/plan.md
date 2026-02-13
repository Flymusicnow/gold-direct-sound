

# Energy Threads v1 -- Remaining Gaps Fix

## What's Already Done (no changes needed)
- Card styling with energy line (border-l-2 #E8BF1A/25)
- Text 15px / 1.5 line-height
- word-break: normal + overflow-wrap: break-word
- Pop-in, energy-pulse, artist-glow, tap-pop animations in tailwind config
- Community Energy Bar on PostCard
- Drawer height 60dvh (min 50%, max 75%)
- Desktop inline comments with max-w-[720px]
- Reply gating ("View X more replies")
- Touch targets 44px
- Emoji in composer
- Chronological sorting (newest at bottom)
- Artist badge and highlight

## Gaps to Fix

### 1. Replies collapsed by default (`CommentThread.tsx`)

**Current:** `isCollapsed` defaults to `false` -- replies are expanded on load.
**Spec:** "View X replies" collapsed by default. User expands manually.

**Fix:** Change `useState(false)` to `useState(true)` for `isCollapsed` when the comment has replies. This makes the Reply Band show "View X replies" by default, matching the Reddit/Energy Stack pattern.

### 2. "Open Conversation" for deep threads (`CommentThread.tsx`)

**Current:** At depth >= maxDepth, the Reply button is hidden (`canReply = depth < maxDepth`). No way to view deeper threads.
**Spec:** If more than 2 reply levels exist, show an "Open Conversation" button that opens the full thread in a bottom sheet (mobile) or navigates to PostDetail (desktop).

**Fix:** When `depth >= maxDepth - 1` and a comment has replies that themselves have replies, show an "Open Conversation" button instead of rendering deeper. On click:
- Mobile: open a Drawer with the sub-thread
- Desktop: navigate to `/post/{postId}` (PostDetail page, which already shows full threads)

For v1 simplicity: "Open Conversation" navigates to `/post/{postId}` on both platforms. This keeps it simple and the PostDetail page already renders full threads with CommentThread.

### 3. Desktop InlineComments energy card styling (`InlineComments.tsx`)

**Current:** Comments use a basic `flex gap-2` layout with avatar beside text. No card styling, no energy line.
**Spec:** Same energy card treatment on desktop: rounded-2xl, p-4, bg-card/50, left energy line, artist glow.

**Fix:** Apply the same card wrapper to each comment in InlineComments:
- `p-4 rounded-2xl bg-card/50 border-l-2 border-[#E8BF1A]/25 animate-comment-pop-in`
- Artist highlight: `border border-[#E8BF1A]/15 animate-artist-glow`
- Move content below the avatar+name row (stacked layout, same as CommentThread)

### 4. Collapse toggle label refinement (`CommentThread.tsx`)

**Current:** "Show X replies" / "Hide replies"
**Spec:** "View X replies" (collapsed default)

**Fix:** Change button text to "View X replies" when collapsed.

## Files to Change

| File | What |
|------|------|
| `src/components/community/CommentThread.tsx` | Default replies to collapsed; add "Open Conversation" nav for deep threads; fix toggle label |
| `src/components/community/InlineComments.tsx` | Apply energy card styling to each comment; stacked layout (avatar+name row, then content below) |

## Technical Details

### CommentThread.tsx

Line 106 -- change initial collapsed state:
```tsx
// Before
const [isCollapsed, setIsCollapsed] = useState(false);

// After -- collapsed by default when there are replies
const [isCollapsed, setIsCollapsed] = useState(true);
```

Add "Open Conversation" button when depth >= maxDepth and comment has deeper replies:
```tsx
{depth >= maxDepth - 1 && hasReplies && (
  <Button
    variant="ghost"
    size="sm"
    className="h-7 px-2 text-muted-foreground"
    onClick={() => navigate(`/post/${comment.post_id}`)}
  >
    Open Conversation
  </Button>
)}
```

This requires passing `navigate` into CommentItem (or using `useNavigate` inside it -- it's already a component so this is fine).

### InlineComments.tsx

Replace the per-comment layout (lines 190-241) from plain flex to energy card:
```tsx
<div className={cn(
  "p-4 rounded-2xl bg-card/50 border-l-2 border-[#E8BF1A]/25 animate-comment-pop-in w-full",
  roleBadge === 'artist' && "border border-[#E8BF1A]/15 animate-artist-glow",
  isOptimistic && "opacity-70"
)}>
  {/* Row 1: Avatar + Name + Badge + Timestamp */}
  <div className="flex items-center gap-2 mb-1 flex-wrap">
    <Avatar className="h-6 w-6 shrink-0">...</Avatar>
    <Name />
    <RoleBadge />
    <Timestamp />
  </div>
  {/* Row 2: Content full width */}
  <p className="text-[15px] leading-[1.5] text-foreground whitespace-pre-wrap w-full"
     style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
    {comment.content}
  </p>
  {/* Row 3: Like action */}
  <Button>...</Button>
</div>
```

## No database or config changes needed
All changes are purely presentational -- existing animations and tailwind config already support this.
