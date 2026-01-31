

# Plan: Karaoke-stil Synkroniserade Lyrics

## Vad behövs

För att lyrics ska följa musiken behöver vi:
1. **Tidsstämplar** på varje textrad (LRC-format)
2. **Synkroniserad visning** som markerar aktuell rad
3. **Editor för artister** att synka text med musik

## LRC-format (Standard för synkade lyrics)

```text
[00:00.00]Intro...
[00:15.50]First verse line here
[00:18.20]Second verse line here
[00:22.00]And so on...
```

Varje rad har en tidsstämpel `[mm:ss.ms]` som anger när den ska visas.

---

## Tekniska Ändringar

### 1. Skapa SyncedLyricsDisplay komponent

**Ny fil:** `src/components/flightdeck/SyncedLyricsDisplay.tsx`

Funktionalitet:
- Parsar LRC-format till array av `{time, text}`
- Lyssnar på `currentTime` från spelaren
- Highlightar och auto-scrollar till aktuell rad
- Stödjer fallback till vanlig text (bakåtkompatibelt)

```text
┌────────────────────────────────────┐
│    tidigare rad (dimmed)           │
│    tidigare rad (dimmed)           │
│  ▸ AKTUELL RAD (highlighted)  ◀   │  ← Auto-scroll hit
│    nästa rad (dimmed)              │
│    nästa rad (dimmed)              │
└────────────────────────────────────┘
```

### 2. Uppdatera NowPlayingScreen

**Fil:** `src/components/flightdeck/NowPlayingScreen.tsx`

Ändringar:
- Ersätt enkel `<pre>` med `<SyncedLyricsDisplay>`
- Skicka `currentTime` och `lyrics` som props
- Behåll fallback för icke-synkade lyrics

### 3. Skapa LRC Editor för artister

**Ny fil:** `src/components/artist/LyricsTimeSyncEditor.tsx`

Funktionalitet för Studio:
- Spela upp låten
- Klicka/tryck på varje rad när den sjungs
- Automatiskt generera tidsstämplar
- Exportera som LRC-format

```text
┌─────────────────────────────────────────────┐
│  🎵 Playing: 0:15 / 3:45    [▶ Play/Pause]  │
├─────────────────────────────────────────────┤
│  [TAP] First verse line here       [00:15]  │
│  [TAP] Second verse line here      [00:18]  │
│  [TAP] Third line...               [ -- ]   │  ← Inte synkad än
│  [TAP] Fourth line...              [ -- ]   │
└─────────────────────────────────────────────┘
```

### 4. Uppdatera EditTrackMetadataDialog

**Fil:** `src/components/artist/EditTrackMetadataDialog.tsx`

Ändringar:
- Lägg till knapp "Sync Lyrics with Music"
- Öppnar `LyricsTimeSyncEditor` i dialog
- Sparar LRC-format till databasen

---

## Dataformat

**Befintlig kolumn:** `tracks.lyrics` (text) - ingen databasändring behövs!

**Nytt stöd för två format:**

| Format | Exempel | Användning |
|--------|---------|------------|
| Plain text | `First line\nSecond line` | Statisk visning |
| LRC | `[00:15.00]First line\n[00:18.00]Second line` | Karaoke-synk |

Komponenten detekterar automatiskt format baserat på om texten börjar med `[`.

---

## Användarflöde för artist

1. Gå till **Studio → Tracks**
2. Klicka **Edit** på en låt
3. Skriv in lyrics (vanlig text)
4. Klicka **"Sync with Music"**
5. Låten spelas - tryck på varje rad när den sjungs
6. Spara - lyrics konverteras till LRC-format

---

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/components/flightdeck/SyncedLyricsDisplay.tsx` | **Ny** - Karaoke-visning |
| `src/components/artist/LyricsTimeSyncEditor.tsx` | **Ny** - Synk-verktyg |
| `src/components/flightdeck/NowPlayingScreen.tsx` | **Ändra** - Använd SyncedLyricsDisplay |
| `src/components/artist/EditTrackMetadataDialog.tsx` | **Ändra** - Lägg till sync-knapp |
| `src/lib/lrc-parser.ts` | **Ny** - LRC parse/format utilities |

---

## Fas 1 vs Fas 2

**Fas 1 (denna plan):**
- SyncedLyricsDisplay med rad-för-rad highlighting
- Enkel tap-to-sync editor
- LRC-format stöd

**Fas 2 (framtida):**
- Ord-för-ord highlighting (som Apple Music)
- Automatisk sync via AI/ljudanalys
- Import från externa LRC-filer

