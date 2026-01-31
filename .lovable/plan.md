
# Plan: Fix Audio Playback in LyricsTimeSyncEditor

## Problem
The Play button doesn't work - audio stays at 0:00/0:00. This indicates the audio is either not loading or the `play()` call is silently failing.

## Root Causes

### 1. Event Listeners Not Re-attached
```tsx
// Current code - runs once on mount, doesn't re-run when audioUrl changes
useEffect(() => {
  const audio = audioRef.current;
  // event listeners setup...
}, []); // ❌ Empty dependency array
```

### 2. No Error Handling on play()
```tsx
// Current code - doesn't handle Promise rejection
audio.play(); // ❌ Browser can reject this
setIsPlaying(!isPlaying);
```

### 3. No Audio Load Error Detection
No `error` event listener means failed loads go unnoticed.

---

## Technical Changes

### File: `src/components/artist/LyricsTimeSyncEditor.tsx`

**1. Add audioUrl to event listener dependency**
```tsx
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
  const handleLoadedMetadata = () => {
    console.log('[LyricsSync] Audio loaded, duration:', audio.duration);
    setDuration(audio.duration);
  };
  const handleEnded = () => setIsPlaying(false);
  const handleError = (e: Event) => {
    console.error('[LyricsSync] Audio error:', e);
    toast.error('Failed to load audio file');
  };
  const handleCanPlay = () => {
    console.log('[LyricsSync] Audio can play');
  };

  audio.addEventListener('timeupdate', handleTimeUpdate);
  audio.addEventListener('loadedmetadata', handleLoadedMetadata);
  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('error', handleError);
  audio.addEventListener('canplay', handleCanPlay);

  // Force reload if src changed
  audio.load();

  return () => {
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('ended', handleEnded);
    audio.removeEventListener('error', handleError);
    audio.removeEventListener('canplay', handleCanPlay);
  };
}, [audioUrl]); // ✅ Re-run when audioUrl changes
```

**2. Handle play() Promise with error handling**
```tsx
const togglePlayPause = useCallback(async () => {
  const audio = audioRef.current;
  if (!audio) return;

  if (isPlaying) {
    audio.pause();
    setIsPlaying(false);
  } else {
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('[LyricsSync] Play failed:', error);
      toast.error('Could not play audio. Try again.');
    }
  }
}, [isPlaying]);
```

**3. Add loading state and feedback**
```tsx
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState<string | null>(null);

// In useEffect
const handleLoadedMetadata = () => {
  setDuration(audio.duration);
  setIsLoading(false);
  setLoadError(null);
};
const handleError = () => {
  setIsLoading(false);
  setLoadError('Failed to load audio');
};
```

**4. Disable Play button while loading**
```tsx
<Button
  variant="outline"
  size="icon"
  onClick={togglePlayPause}
  className="h-10 w-10"
  disabled={isLoading || !!loadError}
>
  {isLoading ? (
    <Loader2 className="h-5 w-5 animate-spin" />
  ) : isPlaying ? (
    <Pause className="h-5 w-5" />
  ) : (
    <Play className="h-5 w-5" />
  )}
</Button>
```

**5. Show error state if audio fails to load**
```tsx
{loadError && (
  <div className="text-center text-destructive text-sm py-2 bg-destructive/10 rounded-lg">
    ❌ {loadError}
  </div>
)}
```

---

## Summary

| Issue | Fix |
|-------|-----|
| Events not firing | Add `audioUrl` to dependency array + call `audio.load()` |
| Play silently fails | Wrap `play()` in try/catch, use async/await |
| No load feedback | Add loading state and error display |
| Button always enabled | Disable during loading or on error |

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/artist/LyricsTimeSyncEditor.tsx` | Fix audio event handling and add error states |
