
# Plan: Fixa Audio Loading i LyricsTimeSyncEditor

## Problem
Spinnern snurrar för evigt eftersom audio-elementet finns inuti `DialogContent` som bara renderas när `open={true}`. Men `useEffect` som laddar audion kör bara när `audioUrl` ändras - INTE när dialogen öppnas.

## Rotorsak (Steg för steg)
1. `LyricsTimeSyncEditor` renderas (open=false)
2. Audio-elementet finns INTE (DialogContent renderas inte)
3. useEffect körs med `[audioUrl]` → `audioRef.current` är null → returnerar tidigt
4. Användaren klickar "Sync with Music" → open=true
5. DialogContent renderas → audio-element skapas
6. MEN useEffect körs INTE igen (audioUrl ändrades inte)
7. Resultat: isLoading=true för alltid, spinnern snurrar

## Lösning
Lägg till `open` i dependency-arrayen så att useEffect körs när dialogen öppnas:

```tsx
useEffect(() => {
  const audio = audioRef.current;
  if (!audio || !open) return; // Returnera om stängd eller inget audio-element

  setIsLoading(true);
  setLoadError(null);
  
  // ... resten av koden ...
  
  audio.load();
  
  return () => { /* cleanup */ };
}, [audioUrl, open]); // ← Lägg till 'open' här
```

## Tekniska Ändringar

### Fil: `src/components/artist/LyricsTimeSyncEditor.tsx`

**Ändring 1:** Uppdatera useEffect-beroendet

Rad 46-89 - Ändra dependency array:

```tsx
// Audio time update - re-run when dialog opens or audioUrl changes
useEffect(() => {
  const audio = audioRef.current;
  if (!audio || !open) return; // ← Lägg till !open check

  setIsLoading(true);
  setLoadError(null);

  // ... befintlig kod för event listeners ...
  
  audio.load();

  return () => {
    // ... cleanup ...
  };
}, [audioUrl, open]); // ← Lägg till 'open'
```

## Sammanfattning

| Före | Efter |
|------|-------|
| `useEffect(..., [audioUrl])` | `useEffect(..., [audioUrl, open])` |
| Audio aldrig laddas | Audio laddas när dialog öppnas |
| Evig spinner | Fungerande uppspelning |
