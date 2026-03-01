
# What Needs to Happen

The Global Home Feed infrastructure is already fully built. The one missing piece is wiring the **💬 comment button** in `GlobalFeedCard` to open the existing `CommentsPanel` (Drawer on mobile, Sheet on desktop) instead of navigating away to the artist page.

Everything else — filter chips, feed cards, new-content pill, infinite scroll — is already live.

---

## The Single Change: Wire Comments Inline in GlobalFeedCard

**File: `src/components/feed/GlobalFeedCard.tsx`**

Currently the comment button does:
```tsx
onClick={() => navigate(`/artist/${item.artistUserId}`)
```

It needs to:
1. Add local state: `const [commentsOpen, setCommentsOpen] = useState(false)`
2. Import and render `CommentsPanel` from `@/components/community/CommentsPanel`
3. Change the comment button `onClick` to `() => setCommentsOpen(true)`
4. Pass the raw post ID (not `post_${id}`) to `CommentsPanel`'s `postId` prop — the prefix `post_` is only used for the feed item key, the actual DB id is needed

The `GlobalFeedItem` currently stores `id` as `post_${p.id}` (with prefix). We need the raw DB `postId` to pass to `CommentsPanel`. Two options:

**Option A (cleanest):** Add a `rawId` field to `GlobalFeedItem` alongside the prefixed `id`.
- In `useGlobalFeed.ts`: add `rawId: p.id` to post items
- In `GlobalFeedCard.tsx`: use `item.rawId` for `CommentsPanel`

**Option B:** Strip the `post_` prefix in the card: `item.id.replace('post_', '')`

Option B is simpler with no hook changes — we'll use that since it's a one-liner and safe (video items will never hit the comments panel since only posts show the comment button).

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/feed/GlobalFeedCard.tsx` | Add `commentsOpen` state, import `CommentsPanel`, wire comment button to open drawer, strip `post_` prefix for postId |

That's it. One file, surgical change.

---

## Technical Detail

```tsx
// State
const [commentsOpen, setCommentsOpen] = useState(false);
const rawPostId = item.id.replace('post_', '');

// Comment button (was navigate, now opens panel)
<button onClick={() => setCommentsOpen(true)} ...>
  <MessageCircle className="h-4 w-4" />
  <span>{formatCount(item.commentCount ?? 0)}</span>
</button>

// Panel (renders inline, portal-based — won't disrupt scroll)
{item.type === 'post' && (
  <CommentsPanel
    postId={rawPostId}
    isOpen={commentsOpen}
    onOpenChange={setCommentsOpen}
    commentCount={item.commentCount}
  />
)}
```

The `CommentsPanel` already handles mobile (Drawer, 60dvh bottom sheet) and desktop (Sheet, right side panel) automatically via `useIsMobile()`. No additional work needed.

---

## Result

- Tapping 💬 on any post card in the Home Feed opens a bottom drawer on mobile with the full comment thread + composer
- No navigation away from the feed — scroll position is preserved
- On desktop, opens as a right-side panel
- All existing CommentsPanel UX (threading, replies, energy lines) works out of the box
