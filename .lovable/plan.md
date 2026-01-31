

# Plan: Fixa Lyrics Sync Editor - Visa Alla Rader

## Problem
Lyrics Time Sync Editor visar bara ~4 rader åt gången med `max-h-[300px]`. Användaren kan inte se eller scrolla till alla 45 rader på mobil.

## Orsak
1. **ScrollArea begränsad till 300px** - för liten för långa lyrics
2. **Möjligt mobilscroll-problem** - Radix ScrollArea kan ha touch-problem på iOS

---

## Tekniska Ändringar

### Fil: `src/components/artist/LyricsTimeSyncEditor.tsx`

**Ändringar:**

1. **Öka ScrollArea-höjd** för att visa fler rader
2. **Lägg till touch-scroll stöd** för mobil
3. **Auto-scroll till aktuell rad** så användaren ser var de är

```tsx
// Ändra ScrollArea från:
<ScrollArea className="flex-1 min-h-[200px] max-h-[300px]">

// Till:
<ScrollArea className="flex-1 min-h-[300px] max-h-[50vh]">
```

**Lägg till auto-scroll till aktuell rad:**
```tsx
const currentLineRef = useRef<HTMLButtonElement>(null);

// Auto-scroll när currentIndex ändras
useEffect(() => {
  if (currentLineRef.current) {
    currentLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}, [currentIndex]);

// På button-elementet:
<button
  ref={isCurrent ? currentLineRef : null}
  ...
>
```

---

## Sammanfattning

| Ändring | Före | Efter |
|---------|------|-------|
| Max höjd | 300px (~4 rader) | 50vh (~12+ rader) |
| Auto-scroll | Nej | Ja, till aktuell rad |
| Touch-scroll | Potentiellt dåligt | Förbättrat |

