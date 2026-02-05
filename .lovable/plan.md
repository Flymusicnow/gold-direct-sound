

# Fix: Mobile Feed Video Card Thumbnails

## Problem Summary

Video cards in the Feed's "Videos" tab show black/empty on initial load because:

1. **Query doesn't include thumbnail_url** - `FanFeed.tsx` fetches videos without the `thumbnail_url` field
2. **CompactVideoCard lacks poster/thumbnail support** - Uses only `<video preload="metadata">` with no fallback image

The Artist page's `VideoCard.tsx` works correctly because it:
- Fetches `thumbnail_url` 
- Renders an `<img>` overlay when not playing
- Only shows the video element during playback

---

## Solution

Apply the same thumbnail pattern from the Artist page to the Feed videos.

---

## Changes

### 1. Update FanFeed.tsx - Add thumbnail_url to query

**File:** `src/pages/FanFeed.tsx`

Update the VideoPost interface and fetch query:

```typescript
interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  thumbnail_url: string | null;  // ADD THIS
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}
```

Update the query (around line 208-224) to include `thumbnail_url`:

```typescript
const { data: videosData } = await supabase
  .from('artist_video_posts')
  .select(`
    id,
    video_url,
    caption,
    created_at,
    thumbnail_url,
    artist_profiles (
      id,
      user_id,
      artist_name,
      avatar_url
    )
  `)
  .in('artist_id', artistIds)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

### 2. Update FeedVideosTab.tsx - Pass thumbnail to card

**File:** `src/components/feed/FeedVideosTab.tsx`

Update interface and pass the thumbnail:

```typescript
interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  thumbnail_url: string | null;  // ADD THIS
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}
```

Pass it to CompactVideoCard:

```typescript
<CompactVideoCard
  key={video.id}
  videoId={video.id}
  videoUrl={video.video_url}
  thumbnailUrl={video.thumbnail_url}  // ADD THIS
  caption={video.caption}
  createdAt={video.created_at}
  artist={video.artist_profiles}
/>
```

---

### 3. Update CompactVideoCard.tsx - Display thumbnail

**File:** `src/components/feed/CompactVideoCard.tsx`

Add `thumbnailUrl` prop and render thumbnail image instead of relying on video metadata:

```typescript
interface CompactVideoCardProps {
  videoId: string;
  videoUrl: string;
  thumbnailUrl: string | null;  // ADD THIS
  caption: string | null;
  createdAt: string;
  artist: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export function CompactVideoCard({
  videoId,
  videoUrl,
  thumbnailUrl,  // ADD THIS
  caption,
  createdAt,
  artist,
}: CompactVideoCardProps) {
```

Update the video container to show thumbnail when not playing:

```typescript
{/* Video Container - 9:16 aspect ratio */}
<div className="relative aspect-[9/16] bg-muted">
  {/* Video element - hidden until playing */}
  <video
    ref={videoRef}
    src={videoUrl}
    className={cn(
      "w-full h-full object-cover",
      !isPlaying && thumbnailUrl && "opacity-0 absolute inset-0"
    )}
    muted={isMuted}
    loop
    playsInline
    preload="metadata"
    poster={thumbnailUrl || undefined}
  />

  {/* Thumbnail overlay - shown when not playing */}
  {thumbnailUrl && !isPlaying && (
    <img
      src={thumbnailUrl}
      alt={caption || 'Video thumbnail'}
      className="w-full h-full object-cover"
    />
  )}

  {/* Fallback skeleton when no thumbnail */}
  {!thumbnailUrl && !isPlaying && (
    <div className="absolute inset-0 bg-muted animate-pulse" />
  )}

  {/* Play overlay when not playing */}
  {!isPlaying && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
        <Play className="h-6 w-6 text-white fill-white" />
      </div>
    </div>
  )}
  
  {/* ... rest of mute button code */}
</div>
```

Import `cn` utility at the top:
```typescript
import { cn } from "@/lib/utils";
```

---

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/FanFeed.tsx` | Add `thumbnail_url` to interface and query |
| `src/components/feed/FeedVideosTab.tsx` | Add `thumbnail_url` to interface, pass to card |
| `src/components/feed/CompactVideoCard.tsx` | Accept `thumbnailUrl` prop, render `<img>` thumbnail |

---

## Expected Result

- Video cards show thumbnails immediately on load (no black cards)
- Same thumbnail source as Artist page (single source of truth)
- Fallback skeleton shown if no thumbnail exists
- Video plays on hover/tap as before
- Consistent 9:16 aspect ratio maintained

