

# ENERGY THREADS Comments v1 -- Implementation Plan

## Current State

The comment system already has:
- Mobile: Drawer (CommentsPanel) with sticky composer
- Desktop: Inline under post (Facebook-style)
- Thread lines, indent cap at 24px, reply gating ("View X more replies")
- Touch targets 44px, word-break guardrails
- Emoji in composer

What's **missing** from the Energy Threads spec:

## Changes Required

### 1. Comment Card Visual Overhaul (`CommentThread.tsx`)

Current: bare `py-3 space-y-1` with dividers between comments. No card styling.

Target per spec:
- Each comment wrapped in a styled card: `rounded-2xl p-4 mb-3 bg-card/50` (dark tone)
- Left "energy line": `border-l-2 border-[#E8BF1A]/25` on every comment
- Text size: `text-[15px] leading-[1.5]` (up from `text-sm`)
- Remove `divide-y divide-border` on the outer container (cards handle spacing now)

### 2. Artist Comment Highlight (`CommentThread.tsx`)

When `roleBadge === 'artist'`:
- Card gets `border border-[#E8BF1A]/15` (subtle gold border)
- Badge already shows "Artist" -- keep as-is
- On initial render, a brief gold glow animation (CSS `animate-artist-glow`, 1.2s)

### 3. Microinteractions (`CommentThread.tsx` + `tailwind.config.ts`)

Add to tailwind config:
- `comment-pop-in`: scale(0.97) to scale(1), opacity 0 to 1, 200ms ease-out
- `energy-pulse`: border-opacity pulse from 25% to 50% and back, 600ms
- `artist-glow`: box-shadow gold glow fade in and out, 1.2s

Apply `animate-comment-pop-in` to each CommentItem wrapper.
Apply `animate-energy-pulse` on the energy line when a new comment appears (via CSS animation on mount).

### 4. Like "Tap Pop" (`CommentThread.tsx`)

On the Heart icon click, add a brief scale animation:
- CSS class `animate-tap-pop`: scale(1.3) then back to 1, 120ms

### 5. Community Energy Bar (`PostCard.tsx`)

Under the actions row (Heart/Comment/Share), add a thin bar:
- 2px height, full width
- Gold gradient fill (`bg-gradient-to-r from-[#E8BF1A]/10 via-[#E8BF1A]/40 to-[#E8BF1A]/10`)
- Width proportional to activity (comments + reactions in last 2h)
- Since we don't track time-windowed activity yet, use a simple formula: `min((comment_count + reaction_count) / 20, 1) * 100%` as fill percentage
- No number shown by default (spec says tap for details -- skip details modal in v1, just show the bar)

### 6. Mobile Drawer Height (`CommentsPanel.tsx`)

Current: `max-h-[85dvh]`
Spec says: 60% height, min 50%, max 75%

Change to: `h-[60dvh] min-h-[50dvh] max-h-[75dvh]`

### 7. Desktop Comment List Max-Width (`InlineComments.tsx` + `PostCard.tsx`)

Spec says comments max 680-760px in center column.
Add `max-w-[720px] mx-auto` to the inline comments container in PostCard.

### 8. Sorting Confirmation

Current: `order('created_at', { ascending: true })` -- chronological, newest last. This matches the spec (democratic, no like-based reorder). No change needed.

## File Summary

| File | Action | What |
|------|--------|------|
| `src/components/community/CommentThread.tsx` | EDIT | Card styling with energy line, artist glow, pop-in animation, text size increase, remove outer dividers |
| `src/components/community/CommentsPanel.tsx` | EDIT | Drawer height 60dvh (min 50%, max 75%) |
| `src/components/community/PostCard.tsx` | EDIT | Add Energy Bar under actions, max-width on inline comments |
| `tailwind.config.ts` | EDIT | Add keyframes/animations: comment-pop-in, energy-pulse, artist-glow, tap-pop |

## Technical Details

### CommentThread.tsx changes

**Outer container** (line 439):
```
Before: "divide-y divide-border max-w-full w-full overflow-hidden"
After:  "space-y-3 max-w-full w-full overflow-hidden"
```

**CommentItem wrapper** (lines 145-147):
```
Before: "py-3 space-y-1 max-w-full w-full min-w-0"
After:  "p-4 rounded-2xl bg-card/50 border-l-2 border-[#E8BF1A]/25 
         max-w-full w-full min-w-0 animate-comment-pop-in"
         + conditional: roleBadge === 'artist' && "border border-[#E8BF1A]/15 animate-artist-glow"
```

**Content text** (line 188):
```
Before: "text-sm"
After:  "text-[15px] leading-[1.5]"
```

**Like button Heart**: Add `animate-tap-pop` class on click via state toggle.

### CommentsPanel.tsx changes

Line 76:
```
Before: max-h-[85dvh]
After:  h-[60dvh] min-h-[50dvh] max-h-[75dvh]
```

### PostCard.tsx changes

After the actions div (line 236), before the inline comments section:
```tsx
{/* Community Energy Bar */}
<div className="w-full h-[2px] bg-muted/30 overflow-hidden rounded-full">
  <div 
    className="h-full bg-gradient-to-r from-[#E8BF1A]/10 via-[#E8BF1A]/40 to-[#E8BF1A]/10 transition-all duration-700"
    style={{ width: `${Math.min(((displayCommentCount + displayReactionCount) / 20) * 100, 100)}%` }}
  />
</div>
```

Inline comments wrapper gets `max-w-[720px] mx-auto`.

### tailwind.config.ts additions

```js
keyframes: {
  'comment-pop-in': {
    '0%': { opacity: '0', transform: 'scale(0.97)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  'energy-pulse': {
    '0%, 100%': { borderColor: 'rgba(232, 191, 26, 0.25)' },
    '50%': { borderColor: 'rgba(232, 191, 26, 0.5)' },
  },
  'artist-glow': {
    '0%': { boxShadow: '0 0 0 0 rgba(232, 191, 26, 0)' },
    '50%': { boxShadow: '0 0 12px 2px rgba(232, 191, 26, 0.15)' },
    '100%': { boxShadow: '0 0 0 0 rgba(232, 191, 26, 0)' },
  },
  'tap-pop': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.3)' },
    '100%': { transform: 'scale(1)' },
  },
},
animation: {
  'comment-pop-in': 'comment-pop-in 200ms ease-out',
  'energy-pulse': 'energy-pulse 600ms ease-in-out',
  'artist-glow': 'artist-glow 1.2s ease-in-out',
  'tap-pop': 'tap-pop 120ms ease-out',
},
```

## What This Does NOT Change

- No database changes
- No sorting algorithm changes (stays chronological)
- No economy/pay features
- No leaderboards
- Desktop stays Facebook-style inline
- Mobile stays Reddit-style drawer
- Composer unchanged (already has emoji + send)
- Reply gating unchanged (already has "View X more replies")

