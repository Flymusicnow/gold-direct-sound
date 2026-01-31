
# Plan: Fixa Audio Loading + Scrollning + Lyrics Highlighting

## Problem 1: Audio laddar aldrig (spinner snurrar)

**Rotorsak:** Audio-elementet är inuti DialogContent (Portal). När `open` blir true:
1. DialogContent renderas via Portal
2. useEffect med `[audioUrl, open]` körs
3. MEN `audioRef.current` är FORTFARANDE null (React har inte hunnit montera)
4. useEffect returnerar tidigt → audio laddas aldrig

**Lösning:** Flytta audio-elementet UTANFÖR DialogContent så det alltid finns tillgängligt.

### Fil: `src/components/artist/LyricsTimeSyncEditor.tsx`

```tsx
// FÖRE (rad 162-178): Audio är INUTI Dialog
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
      <DialogHeader>...</DialogHeader>
      
      {/* Audio element INUTI - PROBLEM! */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      ...
    </DialogContent>
  </Dialog>
);

// EFTER: Audio är UTANFÖR Dialog
return (
  <>
    {/* Audio element UTANFÖR - alltid monterat */}
    <audio 
      ref={audioRef} 
      src={audioUrl} 
      preload="auto"
      crossOrigin="anonymous"
    />
    
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        ...
      </DialogContent>
    </Dialog>
  </>
);
```

**Ytterligare förbättringar:**
- Ändra `preload="metadata"` till `preload="auto"` för snabbare laddning
- Lägg till `crossOrigin="anonymous"` för CORS-stöd med Supabase Storage
- Lägg till mer robust felhantering och debug-loggning

---

## Problem 2: Kan inte skrolla ner för att se alla 45 rader

**Orsak:** DialogContent har `flex flex-col` och ScrollArea har `flex-1 min-h-[300px] max-h-[50vh]`. Det borde fungera, men innehållet kanske tvingas ihop.

**Lösning:** Ge ScrollArea mer explicit höjd och säkerställ att den kan skrolla.

```tsx
// FÖRE:
<ScrollArea className="flex-1 min-h-[300px] max-h-[50vh]">

// EFTER:
<ScrollArea className="flex-1 h-[400px] overflow-y-auto">
```

---

## Problem 3: Förstärk aktiv lyrics-rad på fansidan

**Nuvarande:** `SyncedLyricsDisplay` har redan grundläggande highlighting:
- Aktiv rad: `text-primary font-semibold text-lg` + scale 1.05
- Förflutna rader: `text-muted-foreground` + opacity 0.5
- Kommande rader: `text-muted-foreground/70` + opacity 0.4

**Förbättring:** Lägg till bakgrundsfärg och mer dramatisk animation för aktiv rad.

### Fil: `src/components/flightdeck/SyncedLyricsDisplay.tsx`

```tsx
// FÖRE (rad 86-91):
className={cn(
  "text-center transition-all duration-300",
  isActive && "text-primary font-semibold text-lg",
  isPast && "text-muted-foreground text-base",
  isFuture && "text-muted-foreground/70 text-base"
)}

// EFTER - mer synlig highlighting:
className={cn(
  "text-center transition-all duration-300 py-2 px-4 rounded-lg",
  isActive && "text-primary font-bold text-xl bg-primary/15 shadow-lg shadow-primary/20",
  isPast && "text-muted-foreground text-base opacity-60",
  isFuture && "text-muted-foreground/60 text-base"
)}
```

**Animation förbättring:**
```tsx
// FÖRE:
animate={{
  opacity: isActive ? 1 : isPast ? 0.5 : 0.4,
  scale: isActive ? 1.05 : 1,
}}

// EFTER - mer dynamisk:
animate={{
  opacity: isActive ? 1 : isPast ? 0.5 : 0.35,
  scale: isActive ? 1.08 : 1,
  y: isActive ? -2 : 0, // Liten "lift" effekt
}}
```

---

## Sammanfattning av alla ändringar

| Problem | Fil | Lösning |
|---------|-----|---------|
| Audio laddar aldrig | LyricsTimeSyncEditor.tsx | Flytta `<audio>` utanför Dialog + preload="auto" |
| Kan ej skrolla | LyricsTimeSyncEditor.tsx | Öka ScrollArea höjd |
| Svag lyrics-highlight | SyncedLyricsDisplay.tsx | Starkare färg + bakgrund + animation |

---

## Tekniska detaljer

### LyricsTimeSyncEditor - Audio outside Dialog

```tsx
export function LyricsTimeSyncEditor({
  open,
  onOpenChange,
  plainLyrics,
  audioUrl,
  onSave,
}: LyricsTimeSyncEditorProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // ... state declarations ...

  // useEffect för audio - körs nu korrekt eftersom audio alltid är monterad
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !open) return;

    console.log('[LyricsSync] Setting up audio for:', audioUrl);
    setIsLoading(true);
    setLoadError(null);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      console.log('[LyricsSync] Audio loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      console.error('[LyricsSync] Audio error:', target.error?.code, target.error?.message);
      setIsLoading(false);
      setLoadError(`Audio error: ${target.error?.message || 'Unknown error'}`);
    };
    const handleCanPlayThrough = () => {
      console.log('[LyricsSync] Audio ready to play');
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Tvinga omladdning
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioUrl, open]);

  return (
    <>
      {/* Audio UTANFÖR Dialog - alltid tillgänglig */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="auto"
        crossOrigin="anonymous"
      />
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          {/* ... resten av innehållet ... */}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### SyncedLyricsDisplay - Enhanced highlighting

```tsx
<motion.div
  key={index}
  ref={isActive ? activeLineRef : null}
  initial={{ opacity: 0.35 }}
  animate={{
    opacity: isActive ? 1 : isPast ? 0.5 : 0.35,
    scale: isActive ? 1.08 : 1,
    y: isActive ? -2 : 0,
  }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  className={cn(
    "text-center transition-all duration-300 py-2 px-4 rounded-lg",
    isActive && "text-primary font-bold text-xl bg-primary/15 shadow-lg shadow-primary/20",
    isPast && "text-muted-foreground text-base",
    isFuture && "text-muted-foreground/60 text-base"
  )}
>
  {line.text}
</motion.div>
```

---

## Filer att ändra

1. **`src/components/artist/LyricsTimeSyncEditor.tsx`**
   - Flytta audio-element utanför Dialog
   - Förbättra ScrollArea höjd
   - Lägga till mer debug-loggning

2. **`src/components/flightdeck/SyncedLyricsDisplay.tsx`**
   - Förstärka aktiv rad med bakgrund och skugga
   - Förbättra animation med y-offset
