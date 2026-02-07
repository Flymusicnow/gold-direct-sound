

# Fix: Track Card Clipping in Portrait + Lock Screen Music Controls

## Issue 1: Track Cards Clipped Behind Player in Portrait Mode

### Root Cause

On the FanFeed page, the main content area has `pb-44 md:pb-8` (176px on mobile). But on mobile, two fixed elements stack at the bottom:
- **Bottom navigation bar**: 64px (`h-16`)
- **FlightdeckPlayer bar**: ~120px (progress slider + track info + playback controls)

Total space consumed: ~184px. The padding of 176px is not quite enough, so the last track card(s) get clipped behind the player when scrolling to the end.

In landscape mode, the viewport is wider so the player is more compact (single row), and the content fits. In portrait, the taller player eats into the scroll area.

Additionally, the **loading state** skeleton has only `pb-28` (112px) -- far too little.

### Fix

**File: `src/pages/FanFeed.tsx`**
- Change `pb-44` to `pb-52` (208px) on the main content area -- enough to clear both the bottom nav (64px) and the full player bar (~120px) with breathing room
- Also fix the loading state skeleton view from `pb-28` to `pb-52` for consistency

---

## Issue 2: Lock Screen / Background Music Controls (Media Session API)

### What It Does

When users leave the app (switch to another app, lock their phone), they want to see the currently playing song on their lock screen and notification shade, with the ability to:
- See the song title, artist name, and cover art
- Pause / resume playback
- Skip to next / previous track
- See playback progress

This is exactly what the **Media Session API** provides. It is supported on iOS Safari, Android Chrome, and desktop browsers.

### Implementation

**File: `src/components/flightdeck/FlightdeckPlayer.tsx`**

Add a `useEffect` that syncs with `navigator.mediaSession` whenever the current track changes or play state changes:

1. **Set metadata** when `currentItem` changes:
   - `title`: track title
   - `artist`: artist name
   - `artwork`: cover image (multiple sizes for different devices)

2. **Set action handlers** for:
   - `play` -- calls `togglePlay()` to resume
   - `pause` -- calls `togglePlay()` to pause
   - `previoustrack` -- calls `playPrev()`
   - `nexttrack` -- calls `playNext()`
   - `seekto` -- calls `seek()` for scrubbing on lock screen
   - `seekbackward` / `seekforward` -- 10-second jumps

3. **Sync playback state** when `isPlaying` changes:
   - `navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'`

4. **Update position state** on time updates:
   - `navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: currentTime })`

5. **Clean up** action handlers when component unmounts or when no track is playing

### What Users Will See

- **iOS**: Lock screen shows track title, artist, cover art, and play/pause + skip controls
- **Android**: Notification shade shows a media card with the same controls
- **Desktop**: Media control overlay in the OS (macOS Now Playing widget, Windows media overlay)

No additional libraries or permissions needed -- this is a native browser API.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/FanFeed.tsx` | Increase bottom padding from `pb-44` to `pb-52` (both loaded and loading states) |
| `src/components/flightdeck/FlightdeckPlayer.tsx` | Add Media Session API integration for lock screen controls |

---

## Technical Details

```text
Media Session API Integration (FlightdeckPlayer.tsx):

useEffect when currentItem changes:
  -> navigator.mediaSession.metadata = new MediaMetadata({
       title, artist, artwork: [{ src: coverUrl, sizes: '512x512' }]
     })
  -> Set action handlers: play, pause, nexttrack, previoustrack, seekto

useEffect when isPlaying changes:
  -> navigator.mediaSession.playbackState = 'playing' | 'paused'

handleTimeUpdate already exists:
  -> Add navigator.mediaSession.setPositionState({ duration, position, playbackRate })
```

---

## Acceptance Criteria

- In portrait mode on mobile, all track cards are fully visible when scrolling -- no clipping behind the player
- When music is playing and user switches to another app or locks their phone, the lock screen shows the track info and controls
- Play/pause from lock screen controls the FlightdeckPlayer
- Next/previous track from lock screen skips tracks correctly
- Cover art is visible on the lock screen notification
- Works on iOS Safari, Android Chrome, and desktop browsers

