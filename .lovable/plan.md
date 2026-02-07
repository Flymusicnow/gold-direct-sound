
# Fix Video Feed: Mute Sync, Like System, Counter, Share, and Navigation

## Issues Identified (5 fixes)

### 1. Mute State Not Synced Across Videos
**Problem:** Each `FullScreenVideoItem` manages its own `isMuted` state. When you unmute video 1 and swipe to video 2, it is muted again. You have to tap unmute on every single video.

**Fix:** Lift the mute state up to `FullScreenVideoFeed` and pass it down as a prop. When any video is unmuted/muted, the setting applies globally to all videos in the feed.

**File: `src/components/video/FullScreenVideoFeed.tsx`**
- Add `const [isMuted, setIsMuted] = useState(true)` at the feed level
- Pass `isMuted` and `onToggleMute` down to each `FullScreenVideoItem`

**File: `src/components/video/FullScreenVideoItem.tsx`**
- Remove local `isMuted` state
- Accept `isMuted` and `onToggleMute` as props
- Apply the shared mute state to the `<video>` element

---

### 2. Heart Button: Like (Not Favorites) + Like Count
**Problem:** The heart button says "Added to favorites." It should be a simple like -- and the like count should be visible both in the full-screen feed and in the feed grid cards.

**Fix:**
- Create a `video_likes` database table to track likes per video per user
- Add a `like_count` column to `artist_video_posts` (with a trigger to keep it in sync)
- In `FullScreenVideoItem`: change the heart button to toggle a like (not favorites), show the like count below the heart icon
- In `CompactVideoCard`: show the like count on the grid thumbnail
- Load like state from the database when feed opens (check if user has liked each video)

**Database migration:**
```sql
-- Create video_likes table
CREATE TABLE public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.artist_video_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Add like_count to artist_video_posts
ALTER TABLE public.artist_video_posts 
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- RLS policies
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video likes" ON public.video_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.video_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own" ON public.video_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to sync like_count
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artist_video_posts SET like_count = like_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artist_video_posts SET like_count = like_count - 1 WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER video_likes_count_trigger
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION update_video_like_count();
```

**File: `src/hooks/useFullScreenVideoFeed.ts`**
- Add `likeCount` to the `FeedVideo` interface

**File: `src/components/video/FullScreenVideoItem.tsx`**
- On mount, check if current user has liked this video (query `video_likes`)
- Toggle like inserts/deletes from `video_likes` table
- Show like count below the heart icon
- Change toast messages: remove "Added to favorites", just show filled heart (no toast)

**File: `src/components/feed/CompactVideoCard.tsx`**
- Accept and display `likeCount` on the card (small heart icon + number)

**File: `src/components/feed/FeedVideosTab.tsx`**
- Pass `likeCount` into feed videos data

---

### 3. Remove Video Counter ("3 / 3")
**Problem:** The counter "1 / 3", "2 / 3", "3 / 3" shown at the top center is unnecessary and breaks the immersive feel.

**Fix:** Delete the counter `<div>` from `FullScreenVideoFeed.tsx` (lines 98-101).

**File: `src/components/video/FullScreenVideoFeed.tsx`**
- Remove the video counter element entirely

---

### 4. Share Button Not Working (from Feed)
**Problem:** The share button in the full-screen feed does nothing because `FeedVideosTab` doesn't pass an `onShare` callback to `FullScreenVideoFeed`. On the artist page it works because `ArtistVideosSection` wires it up to `VideoShareModal`.

**Fix:** Use the native Web Share API directly inside `FullScreenVideoItem` instead of relying on a parent callback. This makes sharing work from every entry point without external wiring.

**File: `src/components/video/FullScreenVideoItem.tsx`**
- Replace `onShare?.()` with direct share logic:
  - Try `navigator.share()` first (native mobile share sheet)
  - Fall back to `navigator.clipboard.writeText()` with a toast confirmation
  - Share URL format: `{origin}/artist/{artistUserId}?video={videoId}`

**File: `src/components/video/FullScreenVideoFeed.tsx`**
- Remove the `onShare` prop (no longer needed)

**Files referencing onShare:**
- `src/components/feed/FeedVideosTab.tsx` -- remove `onShare` prop
- `src/components/artist/ArtistVideosSection.tsx` -- remove `onShare` from `FullScreenVideoFeed`

---

### 5. Back Navigation After Artist Tap
**Problem:** When you tap an artist name in the feed, it navigates to their profile. Pressing back does not return to the video feed -- it goes back to the underlying page without reopening the feed overlay.

**Fix:** This is inherently tricky because the feed is a React overlay, not a URL route. The cleanest solution: use `window.history.pushState` to push a virtual state when the feed opens, and listen for `popstate` to close it. This makes the browser back button close the feed (returning to the underlying page with its scroll position intact).

When tapping an artist name, the feed closes (restoring scroll), then navigates to the artist page. Pressing browser back from the artist page returns to `/fan/feed` where the grid is visible. The user can tap a video to reopen the feed.

**File: `src/hooks/useFullScreenVideoFeed.ts`**
- On `openFeed`: push a history state `{ videoFeedOpen: true }`
- Listen for `popstate`: if state changes away from `videoFeedOpen`, close the feed
- On `closeFeed`: if history state is `videoFeedOpen`, go back one step

---

## Files to Create

| File | Purpose |
|------|---------|
| (none -- all changes are modifications) | |

## Database Migration

| Table | Change |
|-------|--------|
| `video_likes` | New table for tracking likes |
| `artist_video_posts` | Add `like_count` column |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/video/FullScreenVideoFeed.tsx` | Lift mute state, remove counter, remove onShare prop |
| `src/components/video/FullScreenVideoItem.tsx` | Accept shared mute state, real like system with count, built-in share |
| `src/hooks/useFullScreenVideoFeed.ts` | Add likeCount to FeedVideo, history state for back nav |
| `src/components/feed/FeedVideosTab.tsx` | Pass likeCount, remove onShare |
| `src/components/feed/CompactVideoCard.tsx` | Show like count on card |
| `src/components/artist/ArtistVideosSection.tsx` | Remove onShare from feed, pass likeCount |

## Acceptance Criteria

- Unmuting one video keeps all subsequent videos unmuted (and vice versa)
- Heart button toggles a "like" (not favorites), shows the like count
- Like count visible both in full-screen feed and feed grid cards
- No "X / Y" counter shown at the top of the feed
- Share button opens native share sheet on mobile, copies link on desktop
- Browser back button from artist profile returns to the feed page
- All changes work on both mobile and desktop
