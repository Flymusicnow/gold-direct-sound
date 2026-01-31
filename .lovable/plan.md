
# Plan: Fixa Lyrics Display, Share & Menu för Fan-vy

## Problem & Lösningar

### 1. Tidsstämplar visas i lyrics (mest kritiska)
**Orsak:** LRC-parsern (`parseLrc`) kräver exakt format `[mm:ss.ms]Text` men:
- Regex matchar `(.+)` efter timestamp, men om det finns dubbla brackets som `[00:02.02][VERSE 1]` behålls den andra
- Plain text fallback visar RAW lyrics inklusive timestamps

**Lösning i `src/lib/lrc-parser.ts`:**
```typescript
// Förbättra regex för att matcha alla timestamps på en rad
// Och returnera enbart texten (utan brackets)
export function parseLrc(lrcText: string): LrcLine[] {
  const lines: LrcLine[] = [];
  // Matcha rader som börjar med [timestamp]
  const lineRegex = /^(\[[\d:.]+\])+(.*)$/gm;
  // ...
  // Strip alla [xx:xx.xx] mönster från texten
}
```

**Lösning i `src/components/flightdeck/SyncedLyricsDisplay.tsx`:**
- Lägg till en `stripTimestamps()` funktion för att rensa bort eventuella kvarvarande timestamps
- Visa ALDRIG timestamps i fan-vyn

### 2. Lyrics följer inte med (synkronisering trasig)

**Orsak:** `currentTime` från FlightdeckContext uppdateras korrekt, men om `isSynced` är false pga parsing-fel, körs ingen highlighting.

**Lösning:**
- Fixa LRC-parsern så `isSynced = true`
- `findCurrentLineIndex` fungerar redan korrekt

### 3. Ingen färg på aktiv text

**Orsak:** Highlighting-koden finns redan men aktiveras bara när `isSynced = true`.

**Befintlig kod (redan fixad tidigare):**
```tsx
isActive && "text-primary font-bold text-xl bg-primary/15 shadow-lg shadow-primary/20"
```

### 4. Share-knappen fungerar inte (mobil)

**Orsak:** NowPlayingScreen är `z-[100]`, men ShareModal (Dialog) har `z-[150]`. På mobilen kan touch events blockeras.

**Lösning i `src/components/flightdeck/NowPlayingScreen.tsx`:**
```tsx
// Wrap ShareModal i en portal med högre z-index
<ShareModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  // ...props
/>
```

**Lösning i `src/components/ShareModal.tsx`:**
```tsx
<DialogContent className="sm:max-w-md bg-card border-primary/20 z-[200]">
```

### 5. Tre-punkter-menyn fungerar inte (mobil)

**Orsak:** Radix DropdownMenu kan ha problem med touch events inuti en fixed container.

**Lösning i `src/components/flightdeck/NowPlayingScreen.tsx`:**
```tsx
<DropdownMenu modal={true}>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative z-[110]">
      <MoreHorizontal className="h-6 w-6" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent 
    align="end" 
    className="z-[300] bg-card"
    sideOffset={5}
  >
    ...
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Tekniska Ändringar

### Fil 1: `src/lib/lrc-parser.ts`

**Förbättra `parseLrc` för att hantera alla LRC-varianter:**
```typescript
export function parseLrc(lrcText: string): LrcLine[] {
  const lines: LrcLine[] = [];
  
  // Split by newlines first
  const rawLines = lrcText.split('\n');
  
  for (const rawLine of rawLines) {
    // Match all timestamps at start of line
    const timestampRegex = /\[(\d{1,2}):(\d{2})([.:])(\d{2,3})\]/g;
    let lastMatch: RegExpExecArray | null = null;
    let firstTime: number | null = null;
    
    // Find all timestamps
    while ((match = timestampRegex.exec(rawLine)) !== null) {
      if (firstTime === null) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[4].padEnd(3, '0'), 10);
        firstTime = mins * 60 + secs + ms / 1000;
      }
      lastMatch = match;
    }
    
    if (firstTime !== null && lastMatch) {
      // Text is everything after the last timestamp
      const textStart = lastMatch.index + lastMatch[0].length;
      const text = rawLine.slice(textStart).trim();
      
      if (text) {
        lines.push({ time: firstTime, text });
      }
    }
  }
  
  return lines.sort((a, b) => a.time - b.time);
}

// Helper att ta bort alla timestamps från text
export function stripTimestamps(text: string): string {
  return text.replace(/\[\d{1,2}:\d{2}[.:]\d{2,3}\]/g, '').trim();
}
```

**Gör `isLrcFormat` mer flexibel:**
```typescript
export function isLrcFormat(text: string): boolean {
  // Match variations: [00:00.00], [0:00.00], [00:00:00], [00:00.000]
  return /\[\d{1,2}:\d{2}[.:]\d{2,3}\]/.test(text.trim());
}
```

### Fil 2: `src/components/flightdeck/SyncedLyricsDisplay.tsx`

**Strip timestamps från visad text:**
```tsx
import { parseLrc, isLrcFormat, findCurrentLineIndex, stripTimestamps } from '@/lib/lrc-parser';

// I render:
<motion.div ...>
  {stripTimestamps(line.text)}
</motion.div>
```

### Fil 3: `src/components/flightdeck/NowPlayingScreen.tsx`

**Fixa DropdownMenu för mobil:**
```tsx
<DropdownMenu modal={true}>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative z-[110]">
      <MoreHorizontal className="h-6 w-6" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent 
    align="end" 
    className="z-[300] bg-card"
    sideOffset={8}
    onCloseAutoFocus={(e) => e.preventDefault()}
  >
```

**Fixa ShareModal z-index:**
Öka z-index på ShareModal's DialogContent

### Fil 4: `src/components/ShareModal.tsx`

**Höj z-index:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-md bg-card border-primary/20 z-[250]">
```

---

## Sammanfattning

| Problem | Fil | Ändring |
|---------|-----|---------|
| Timestamps visas | lrc-parser.ts | Förbättra regex, lägg till stripTimestamps() |
| Ingen synk/färg | SyncedLyricsDisplay.tsx | Använd stripTimestamps() på visad text |
| Share funkar ej | ShareModal.tsx | Höj z-index till z-[250] |
| Menu funkar ej | NowPlayingScreen.tsx | Lägg till modal={true}, höj z-index till z-[300] |

## Filer att ändra
1. `src/lib/lrc-parser.ts` - Förbättra LRC-parsing och lägg till stripTimestamps
2. `src/components/flightdeck/SyncedLyricsDisplay.tsx` - Strip timestamps från visning
3. `src/components/flightdeck/NowPlayingScreen.tsx` - Fixa DropdownMenu för mobil
4. `src/components/ShareModal.tsx` - Höj z-index
