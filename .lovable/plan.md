
# Plan: Fixa Mobila Problem + Desktop Paritet

## Identifierade Problem

### 1. Timestamps visar alla 00:00
**Orsak:** Audio-elementet i LyricsTimeSyncEditor fungerar, men användaren kanske inte trycker på raderna medan musiken spelar. Editorn kräver att man:
1. Först klickar Play
2. Sedan trycker på varje rad i realtid

**Möjlig bugg:** Audio URL kan vara relativ sökväg istället för full Supabase URL.

### 2. Share-knappen fungerar inte på mobil
**Orsak:** NowPlayingScreen har `z-[100]` men Dialog-komponenten har `z-50`. Dialogen renderas BAKOM spelaren!

### 3. Lyrics-knappen fungerar inte på mobil
**Samma orsak:** Lyrics-panelen är `position: absolute` med lågt z-index. Den täcks av andra element.

### 4. Tre-punkters-menyn gör ingenting
**Orsak:** MoreHorizontal-knappen saknar helt onClick-handler! (rad 184-186 i NowPlayingScreen)

### 5. Desktop saknar lyrics-visning
**Behov:** Lägga till lyrics-stöd i desktop-spelaren också.

---

## Tekniska Ändringar

### Fil 1: `src/components/ui/dialog.tsx`
**Ändring:** Öka z-index från z-50 till z-[150] för att fungera ovanpå NowPlayingScreen

```tsx
// DialogOverlay: z-50 → z-[150]
// DialogContent: z-50 → z-[150]
```

### Fil 2: `src/components/flightdeck/NowPlayingScreen.tsx`

**Ändring 1:** Lägg till tre-punkters-meny med DropdownMenu
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Ersätt tom MoreHorizontal-knapp med:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-6 w-6" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="z-[200]">
    <DropdownMenuItem onClick={() => navigate(`/track/${currentItem.id}`)}>
      View Track Page
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate(`/artist/${currentItem.artistUserId}`)}>
      Go to Artist
    </DropdownMenuItem>
    {/* Fler alternativ */}
  </DropdownMenuContent>
</DropdownMenu>
```

**Ändring 2:** Flytta lyrics-panelen till högre z-index och flytta positionen
```tsx
// Ändra lyrics-panel position och z-index
<motion.div
  className="fixed inset-x-0 bottom-0 z-[110] bg-card/95 backdrop-blur-lg"
  // ... istället för absolute bottom-40
>
```

### Fil 3: `src/components/artist/LyricsTimeSyncEditor.tsx`

**Ändring:** Lägg till instruktioner och förbättra UX
```tsx
// Lägg till tydligare instruktioner
<DialogDescription>
  1. Press Play to start the song
  2. Tap each line when you hear it sung
  3. The timestamp will be recorded automatically
</DialogDescription>

// Lägg till visuell indikator när audio inte spelar
{!isPlaying && (
  <div className="text-center text-amber-500 text-sm">
    ⚠️ Press Play first, then tap lines as they're sung
  </div>
)}
```

### Fil 4: Desktop Player (MiniPlayer eller FlightdeckBar)

**Behov:** Lägg till lyrics-knapp och modal på desktop-spelaren också.

---

## Sammanfattning av ändringar

| Problem | Fil | Lösning |
|---------|-----|---------|
| Share fungerar inte | dialog.tsx | Öka z-index till z-[150] |
| Lyrics fungerar inte | NowPlayingScreen.tsx | Fixa z-index på lyrics-panel |
| Tre-punkter gör inget | NowPlayingScreen.tsx | Lägg till DropdownMenu |
| Timestamps 00:00 | LyricsTimeSyncEditor.tsx | Förtydliga instruktioner |
| Desktop saknar lyrics | FlightdeckBar.tsx | Lägg till lyrics-knapp |

---

## VIKTIGT: Regel för framtiden

Alla UI-ändringar ska testas och fungera på BÅDE:
- Mobil (NowPlayingScreen fullskärm)
- Desktop (FlightdeckBar mini-player)

Detta gäller speciellt:
- Dialogs och modals (z-index)
- Knappar och kontroller
- Notifikationer och toast-meddelanden
