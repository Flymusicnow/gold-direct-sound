
# Plan: Fixa Mobila Problem i NowPlayingScreen och Feed

## Identifierade Problem

### 1. ❌ Share-knappen fungerar inte
**Orsak:** `ShareModal` i `NowPlayingScreen` delar artist-profil URL istället för låten. Den försöker också använda `useSupportScore` hook som kan krascha om providern saknas.

### 2. ❌ Lyrics-knappen är avaktiverad
**Orsak:** Knappen fungerar - den är bara disabled när låten saknar lyrics (`disabled={!lyrics}`). Men artister har INGET SÄTT att lägga in lyrics!

### 3. ❌ Artister kan inte lägga till lyrics
**Orsak:** Varken `StudioTracks` (uppladdningsformulär) eller `EditTrackMetadataDialog` har ett lyrics-fält. Databasen har kolumnen (`tracks.lyrics` = text), men det finns ingen UI för att fylla i den.

### 4. ❌ Kan inte svepa till nästa låt
**Orsak:** `NowPlayingScreen` har inga horisontella swipe-gester. Bara skip-knappar finns.

### 5. ❌ Feed visas avklippt på mobil
**Orsak:** Top-nav överlappar innehållet. Behöver justera scroll-container.

---

## Tekniska Ändringar

### Fil 1: `src/components/flightdeck/NowPlayingScreen.tsx`

**Ändringar:**
1. **Lägg till swipe-gester** för att byta låt (vänster = nästa, höger = föregående)
2. **Fixa Share-funktionen** - dela låt-URL istället för artist-profil
3. **Förbättra lyrics-knappen** - visa tooltip om lyrics saknas

**Ny kod:**
```typescript
// Import för swipe-gester
import { useRef, useCallback } from 'react';

// Swipe-state i komponenten
const touchStartX = useRef<number | null>(null);
const touchStartY = useRef<number | null>(null);

// Swipe-handlers för att byta låt
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
}, []);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  if (touchStartX.current === null || touchStartY.current === null) return;
  
  const deltaX = e.changedTouches[0].clientX - touchStartX.current;
  const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
  
  // Horisontell swipe (inte vertikal)
  if (Math.abs(deltaX) > 80 && deltaY < 80) {
    if (deltaX < 0) {
      // Swipe vänster = nästa låt
      playNext();
    } else {
      // Swipe höger = föregående låt
      playPrev();
    }
  }
  
  touchStartX.current = null;
  touchStartY.current = null;
}, [playNext, playPrev]);
```

**Share-fix:**
```typescript
// Dela låt-URL istället för artist-profil
<ShareModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  artistName={currentItem.artistName}
  shareUrl={`${window.location.origin}/track/${currentItem.id}`}  // Ändrat!
  artistId={currentItem.artistId}
/>
```

---

### Fil 2: `src/components/artist/EditTrackMetadataDialog.tsx`

**Ändringar:**
Lägg till lyrics-textarea så artister kan redigera lyrics för befintliga låtar.

**Ny kod:**
```typescript
// Ny state
const [lyrics, setLyrics] = useState(currentTrack.lyrics || "");

// Ny UI-sektion
<div className="space-y-2">
  <Label htmlFor="edit-lyrics" className="flex items-center gap-2">
    <AlignLeft className="h-4 w-4 text-primary" />
    Lyrics
  </Label>
  <Textarea
    id="edit-lyrics"
    value={lyrics}
    onChange={(e) => setLyrics(e.target.value)}
    placeholder="Add song lyrics..."
    rows={8}
    className="font-mono text-sm"
  />
  <p className="text-xs text-muted-foreground">
    Lyrics will display when fans play your track
  </p>
</div>

// Uppdatera save-funktionen
const { error } = await supabase
  .from("tracks")
  .update({
    // ... existing fields
    lyrics: lyrics.trim() || null,  // Lägg till!
  })
  .eq("id", trackId);
```

---

### Fil 3: `src/pages/studio/StudioTracks.tsx`

**Ändringar:**
Lägg till lyrics-fält i single-track upload formuläret.

**Ny kod:**
```typescript
// Ny state
const [trackLyrics, setTrackLyrics] = useState("");

// Ny UI efter description
<div>
  <Label htmlFor="lyrics">Lyrics (optional)</Label>
  <Textarea
    id="lyrics"
    value={trackLyrics}
    onChange={(e) => setTrackLyrics(e.target.value)}
    rows={6}
    placeholder="Add your song lyrics..."
    className="font-mono text-sm"
  />
</div>

// Uppdatera insert
const { error: insertError } = await supabase.from('tracks').insert({
  // ... existing fields
  lyrics: trackLyrics.trim() || null,  // Lägg till!
});

// Reset efter upload
setTrackLyrics("");
```

---

### Fil 4: Interface-uppdateringar

**`EditTrackMetadataDialogProps.currentTrack`** behöver inkludera `lyrics`:
```typescript
currentTrack: {
  // ... existing fields
  lyrics: string | null;  // Lägg till!
}
```

---

## Sammanfattning

| Problem | Fil | Lösning |
|---------|-----|---------|
| Share fungerar inte | NowPlayingScreen.tsx | Dela låt-URL, inte artist-URL |
| Lyrics disabled | EditTrackMetadataDialog.tsx | Lägg till lyrics-fält |
| Kan inte lägga till lyrics | StudioTracks.tsx | Lägg till lyrics i upload-formulär |
| Kan inte svepa till nästa | NowPlayingScreen.tsx | Lägg till horisontella swipe-gester |
| Feed avklippt | Redan fixat | pb-44 applicerat |

## Beroenden

Inga nya paket behövs - framer-motion och touch events finns redan.

## Tidsuppskattning

~4 ändringar i befintliga filer, ingen ny infrastruktur krävs.
