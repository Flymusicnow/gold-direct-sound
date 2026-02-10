

# Fix: Comments Always Showing Video 1's Data

## Root Cause

Every `FullScreenVideoItem` in the feed renders its own `VideoCommentSheet` at all times, even when the video is off-screen. Since the comment sheet uses `fixed bottom-0` positioning for its backdrop and panel, all sheets occupy the same screen space in the DOM. When you tap the comment icon on video 2 or 3, the touch event can hit the wrong sheet (video 1's), because it sits earlier in the DOM stacking order.

## Fix (1 file, 1 change)

**File: `src/components/video/FullScreenVideoItem.tsx`**

Only render `VideoCommentSheet` when the video is currently active. The `isActive` prop is already available.

Before:
```tsx
{/* Comments */}
<VideoCommentSheet
  videoId={video.id}
  artistId={video.artistId}
  onOpenChange={handleCommentSheetChange}
/>
```

After:
```tsx
{/* Comments — only mount on active video to prevent cross-contamination */}
{isActive && (
  <VideoCommentSheet
    videoId={video.id}
    artistId={video.artistId}
    onOpenChange={handleCommentSheetChange}
  />
)}
```

This ensures only one `VideoCommentSheet` exists in the DOM at any time, always for the currently visible video. When you swipe to a new video, the old sheet unmounts and a fresh one mounts with the correct `videoId`.

## Why this works
- Only the active video's comment trigger is rendered, so taps always target the correct video
- The sheet unmounts on swipe, cleaning up real-time subscriptions and state automatically
- The `key={videoId}` on the inner `VideoCommentsSection` is retained as extra safety
- Comment counts on non-active videos don't need to be visible (they're off-screen)

