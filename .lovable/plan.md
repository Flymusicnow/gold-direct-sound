

# Fix: Full-Screen Video Feed Layout + Comment Bug

## Issues

### Issue 1 + 3: Bottom nav covers video, profile/comments hidden
The full-screen video feed is rendered **inside** `FeedVideosTab` (which is inside the page layout). Even though it uses `fixed inset-0 z-[100]`, the parent's stacking context can interfere. The bottom navigation bar (`z-50`) remains visible on top.

**Fix**: Use a React Portal to render `FullScreenVideoFeed` directly into `document.body`, breaking out of all parent stacking contexts. This ensures it truly covers the entire screen including the bottom nav. Also adjust the caption and action bar positioning to account for safe areas.

### Issue 2: Comments all go to video #1
Each `FullScreenVideoItem` renders its own `VideoCommentSheet` with the correct `videoId`. However, the comment sheet panel uses `fixed bottom-0` positioning, so when opened from any video, it correctly uses the right `videoId`. The likely issue is that the `VideoCommentsSection` inside the sheet has the `Collapsible` component that starts as `isExpanded: true`, but the outer `Collapsible` wrapper with the "Comments (N)" header + Show/Hide button is adding visual noise and a redundant collapsible layer inside the already-collapsible sheet. More critically: the `VideoCommentsSection` counts ALL comments (`comments.length`) but the sheet header shows `commentCount` fetched separately. If there's a mismatch, it could appear like comments are wrong.

After more careful analysis: the actual bug is that `VideoCommentSheet` **does not reset its state when `videoId` changes**. The sheet is mounted once per `FullScreenVideoItem`, so `videoId` should be stable. But the `VideoCommentsSection` inside it uses a `useEffect` that resets on `videoId` change. This should work correctly.

The most likely cause: the sheet's `useEffect` for fetching comment count uses `videoId` as a dependency, but the embedded `VideoCommentsSection` also starts its own fetch. If there's a race condition or if the real-time channel name collides, comments could cross-contaminate. The channel names are unique (`video_comments_${videoId}` and `comment_count_${videoId}`), so this should be fine.

Let me propose a defensive fix: ensure `VideoCommentsSection` is only mounted when the sheet is open, and passes the correct `videoId` as a key to force remounting on video change.

## Changes

### 1. Portal rendering for FullScreenVideoFeed

**File: `src/components/feed/FeedVideosTab.tsx`**
- Wrap `FullScreenVideoFeed` in `ReactDOM.createPortal(...)` targeting `document.body`
- This ensures the feed renders outside the page DOM tree, above all other content including bottom nav

### 2. Hide bottom nav when feed is open

**File: `src/components/video/FullScreenVideoFeed.tsx`**
- On mount: add a class to `document.body` (e.g., `video-feed-open`) that hides the bottom nav
- On unmount: remove the class

**File: `src/index.css`**
- Add rule: `body.video-feed-open .bottom-nav-bar { display: none !important; }`

**File: `src/components/mobile/BottomNavBarFan.tsx`**
- Add `bottom-nav-bar` class to the root div so the CSS rule can target it

### 3. Adjust bottom positioning for safe areas

**File: `src/components/video/VideoCaption.tsx`**
- Change `bottom-6` to `bottom-8` with `pb-safe` (env safe-area-inset-bottom) to ensure the artist name and caption are not hidden behind browser chrome

**File: `src/components/video/FullScreenVideoItem.tsx`**
- Change action bar from `bottom-32` to `bottom-36` to push it above the caption area and safe zone

### 4. Fix comment sheet videoId isolation

**File: `src/components/video/VideoCommentSheet.tsx`**
- Add `key={videoId}` to the `VideoCommentsSection` component to force a clean remount when `videoId` changes
- Only render `VideoCommentsSection` when the sheet is open (lazy mount) to avoid all videos loading comments simultaneously
- Reset `isOpen` state when `videoId` changes

### 5. Apply same portal pattern to ArtistVideosSection

**File: `src/components/artist/ArtistVideosSection.tsx`**
- If this file also renders `FullScreenVideoFeed` inline, apply the same portal fix

## Technical Summary

| File | Change |
|------|--------|
| `src/components/feed/FeedVideosTab.tsx` | Wrap feed in `createPortal` |
| `src/components/video/FullScreenVideoFeed.tsx` | Toggle body class to hide bottom nav |
| `src/index.css` | CSS rule to hide bottom nav when feed is open |
| `src/components/mobile/BottomNavBarFan.tsx` | Add targeting class |
| `src/components/mobile/BottomNavBarStudio.tsx` | Add targeting class (same fix for artist portal) |
| `src/components/video/VideoCaption.tsx` | Increase bottom spacing with safe area |
| `src/components/video/FullScreenVideoItem.tsx` | Adjust action bar bottom position |
| `src/components/video/VideoCommentSheet.tsx` | Add `key={videoId}`, lazy-mount comments, reset state on videoId change |

## Acceptance Criteria
- Full-screen video feed covers the entire screen (no bottom nav visible)
- Artist profile and caption are visible at the bottom of the video
- Comment icon and count are visible and not cut off
- Comments are correctly associated with each video (not all on video 1)
- Swiping between videos maintains correct comment isolation
- Browser back button still works to close the feed
