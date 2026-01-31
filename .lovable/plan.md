
# Plan: Håll Aktiv Lyrics-rad Alltid Centrerad

## Problemanalys

Från skärmdumpen ser jag att:
1. Texten visas men den aktiva raden är inte centrerad i viewporten
2. Auto-scroll till center fungerar inte pålitligt
3. Användaren vill att systemet automatiskt "fångar upp" även om de scrollar bort

## Nuvarande implementation

```tsx
// SyncedLyricsDisplay.tsx (rad 37-44)
useEffect(() => {
  if (activeLineRef.current && isSynced) {
    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}, [currentLineIndex, isSynced]);
```

**Problem:**
1. `ScrollArea` har fast höjd (`h-64` = 256px) - för liten för centrering
2. Saknar padding top/bottom - första och sista raderna KAN inte centreras
3. `scrollIntoView` fungerar dåligt med Radix ScrollArea

## Lösning

### 1. Lägg till stor padding top/bottom för centrering

```tsx
// Padding så första/sista rad kan centreras
<div className="py-32 px-4 space-y-2">
  {/* 128px padding = halva viewport-höjden */}
```

### 2. Använd programmatisk scroll istället för scrollIntoView

```tsx
useEffect(() => {
  if (activeLineRef.current && containerRef.current && isSynced) {
    const container = containerRef.current;
    const activeLine = activeLineRef.current;
    
    // Beräkna position för att centrera
    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    
    const scrollOffset = lineRect.top - containerRect.top - (containerRect.height / 2) + (lineRect.height / 2);
    
    container.scrollTo({
      top: container.scrollTop + scrollOffset,
      behavior: 'smooth'
    });
  }
}, [currentLineIndex, isSynced]);
```

### 3. Ge ScrollArea referens till viewport

Radix ScrollArea har en `Viewport` komponent som är det scrollbara elementet. Vi behöver referera till den:

```tsx
const scrollViewportRef = useRef<HTMLDivElement>(null);

<ScrollAreaPrimitive.Viewport 
  ref={scrollViewportRef}
  className="h-full w-full"
>
```

### 4. Alternativ: Använd CSS scroll-snap

```tsx
<div className="snap-y snap-mandatory overflow-y-auto">
  {lines.map((line, index) => (
    <div 
      key={index}
      className={cn(
        "snap-center py-4",
        isActive && "..."
      )}
    >
      {line.text}
    </div>
  ))}
</div>
```

## Tekniska ändringar

### Fil: `src/components/flightdeck/SyncedLyricsDisplay.tsx`

**Komplett ny approach:**

```tsx
import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseLrc, isLrcFormat, findCurrentLineIndex, stripTimestamps } from '@/lib/lrc-parser';
import { cn } from '@/lib/utils';

interface SyncedLyricsDisplayProps {
  lyrics: string;
  currentTime: number;
  className?: string;
}

export function SyncedLyricsDisplay({ lyrics, currentTime, className }: SyncedLyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse lyrics - handle both LRC and plain text
  const { lines, isSynced } = useMemo(() => {
    if (isLrcFormat(lyrics)) {
      return { lines: parseLrc(lyrics), isSynced: true };
    }
    const plainLines = lyrics.split('\n').filter(line => line.trim());
    return { 
      lines: plainLines.map((text) => ({ time: -1, text: stripTimestamps(text) })), 
      isSynced: false 
    };
  }, [lyrics]);

  const currentLineIndex = useMemo(() => {
    if (!isSynced) return -1;
    return findCurrentLineIndex(lines, currentTime);
  }, [lines, currentTime, isSynced]);

  // Robust auto-scroll - alltid centrera aktiv rad
  useEffect(() => {
    if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
    
    const container = scrollContainerRef.current;
    const activeLine = activeLineRef.current;
    
    // Beräkna var raden bör vara för att vara centrerad
    const containerHeight = container.clientHeight;
    const lineOffsetTop = activeLine.offsetTop;
    const lineHeight = activeLine.offsetHeight;
    
    // Scroll till position där aktiv rad är i mitten
    const targetScroll = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, [currentLineIndex, isSynced]);

  if (lines.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
        No lyrics available
      </div>
    );
  }

  // Plain text display
  if (!isSynced) {
    return (
      <div 
        ref={scrollContainerRef}
        className={cn("h-64 overflow-y-auto", className)}
      >
        <div className="py-32 px-6">
          <pre className="whitespace-pre-wrap text-center text-base leading-relaxed font-sans">
            {stripTimestamps(lyrics)}
          </pre>
        </div>
      </div>
    );
  }

  // Synced karaoke display
  return (
    <div 
      ref={scrollContainerRef}
      className={cn("h-64 overflow-y-auto scroll-smooth", className)}
    >
      {/* Stor padding så första/sista rad kan centreras */}
      <div className="py-32 px-4 space-y-3">
        {lines.map((line, index) => {
          const isActive = index === currentLineIndex;
          const isPast = index < currentLineIndex;
          const isFuture = index > currentLineIndex;

          return (
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
                "text-center transition-all duration-300 py-3 px-4 rounded-lg",
                isActive && "text-primary font-bold text-xl bg-primary/15 shadow-lg shadow-primary/20",
                isPast && "text-muted-foreground text-base",
                isFuture && "text-muted-foreground/60 text-base"
              )}
            >
              {stripTimestamps(line.text)}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

**Viktiga ändringar:**
1. **Ersätt `ScrollArea` med vanlig div** - Enklare att kontrollera scroll
2. **`py-32` padding** - 128px utrymme så första/sista rad kan centreras
3. **`offsetTop` beräkning** - Mer pålitlig än `scrollIntoView`
4. **`scroll-smooth` CSS** - Backup för smooth scrolling

### Fil: `src/components/flightdeck/NowPlayingScreen.tsx`

Öka höjden på lyrics-panelen för bättre centrering:

```tsx
// Rad 362-373 - Lyrics panel
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  className="fixed inset-x-0 bottom-40 z-[110] bg-card/95 backdrop-blur-lg overflow-hidden border-t border-border"
>
  <SyncedLyricsDisplay 
    lyrics={lyrics} 
    currentTime={currentTime}
    className="h-72" // Öka från h-64 till h-72
  />
</motion.div>
```

## Sammanfattning

| Ändring | Syfte |
|---------|-------|
| Ersätt ScrollArea med vanlig div | Direkt kontroll över scroll |
| `py-32` padding | Första/sista rad kan centreras |
| `offsetTop` beräkning | Pålitligare scroll-position |
| `h-72` höjd | Mer utrymme för lyrics |

## Filer att ändra

1. `src/components/flightdeck/SyncedLyricsDisplay.tsx` - Ny scroll-logik
2. `src/components/flightdeck/NowPlayingScreen.tsx` - Justera höjd
