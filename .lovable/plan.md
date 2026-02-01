

# Fix: Video Playback Not Working

## Problem Identified

Two critical bugs prevent video playback:

### Bug 1: VideoCard.tsx - Null Video Reference
When displaying a thumbnail, the `<video>` element is conditionally NOT rendered:
```typescript
{video.thumbnail_url && !isPlaying ? (
  <img ... />  // Video element doesn't exist!
) : (
  <video ref={videoRef} ... />  // Only rendered when isPlaying=true
)}
```

When user clicks play, `handlePlayClick` tries:
```typescript
if (videoRef.current) {  // This is NULL when showing thumbnail!
  videoRef.current.play()...
} else {
  onOpenFullscreen(index);  // Falls back here, but may have issues
}
```

### Bug 2: StudioVideos.tsx - Popup Blocker
The studio video cards use `window.open(video.video_url, '_blank')` which:
- Opens raw video URL in new tab (not a player)
- Gets blocked by popup blockers
- Poor user experience

## Solution

### Fix 1: VideoCard.tsx - Always Render Video Element
Keep the video element always in the DOM but hide it when showing thumbnail:

```typescript
{/* Always render video element for ref access */}
<video
  ref={videoRef}
  src={video.video_url}
  className={cn(
    "w-full aspect-video object-cover",
    video.is_supporter_only && !hasAccess && 'blur-sm',
    video.thumbnail_url && !isPlaying && 'hidden'  // Hide but keep in DOM
  )}
  playsInline
  ...
/>

{/* Show thumbnail overlay when not playing */}
{video.thumbnail_url && !isPlaying && (
  <img
    src={video.thumbnail_url}
    alt={video.caption || 'Video thumbnail'}
    className={cn(
      "absolute inset-0 w-full h-full object-cover",
      video.is_supporter_only && !hasAccess && 'blur-sm'
    )}
  />
)}
```

### Fix 2: StudioVideos.tsx - Add Proper Video Modal
Replace `window.open` with a video player modal:

**Add state:**
```typescript
const [playingVideo, setPlayingVideo] = useState<VideoPost | null>(null);
```

**Replace click handler:**
```typescript
onClick={() => setPlayingVideo(video)}
```

**Add video dialog:**
```typescript
{playingVideo && (
  <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
    <DialogContent className="max-w-4xl p-0 overflow-hidden">
      <video
        src={playingVideo.video_url}
        controls
        autoPlay
        className="w-full aspect-video"
      />
    </DialogContent>
  </Dialog>
)}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/artist/VideoCard.tsx` | Always render video element, show thumbnail as overlay |
| `src/pages/studio/StudioVideos.tsx` | Replace window.open with video dialog modal |

## Technical Details

### VideoCard.tsx Changes (around line 150-180)

**Before:**
```typescript
{video.thumbnail_url && !isPlaying ? (
  <img src={video.thumbnail_url} ... />
) : (
  <video ref={videoRef} src={video.video_url} ... />
)}
```

**After:**
```typescript
<div className="relative w-full aspect-video">
  {/* Video element - always in DOM for ref access */}
  <video
    ref={videoRef}
    src={video.video_url}
    className={`w-full h-full object-cover ${
      video.is_supporter_only && !hasAccess ? 'blur-sm' : ''
    } ${video.thumbnail_url && !isPlaying ? 'opacity-0 absolute' : ''}`}
    playsInline
    webkit-playsinline="true"
    muted={!isPlaying}
    loop
    preload="metadata"
    onPlay={() => setIsPlaying(true)}
    onPause={handleVideoPause}
    onEnded={handleVideoEnded}
  />
  
  {/* Thumbnail overlay - shown when not playing */}
  {video.thumbnail_url && !isPlaying && (
    <img
      src={video.thumbnail_url}
      alt={video.caption || 'Video thumbnail'}
      className={`absolute inset-0 w-full h-full object-cover ${
        video.is_supporter_only && !hasAccess ? 'blur-sm' : ''
      }`}
    />
  )}
</div>
```

### StudioVideos.tsx Changes

**Add import:**
```typescript
import { Dialog, DialogContent } from "@/components/ui/dialog";
```

**Add state (around line 80):**
```typescript
const [playingVideo, setPlayingVideo] = useState<VideoPost | null>(null);
```

**Replace click handler (line 879):**
```typescript
onClick={() => setPlayingVideo(video)}
```

**Add dialog (after EditVideoDialog, around line 1000):**
```typescript
{/* Video Player Dialog */}
{playingVideo && (
  <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
      <VisuallyHidden>
        <DialogTitle>Video Player</DialogTitle>
      </VisuallyHidden>
      <video
        src={playingVideo.video_url}
        controls
        autoPlay
        playsInline
        className="w-full aspect-video"
      />
    </DialogContent>
  </Dialog>
)}
```

## Result After Fix

- Video plays immediately when clicking play button on artist page
- Video plays in proper modal on studio page (not blocked by popup)
- Thumbnails display correctly as preview
- Works on both desktop and mobile

