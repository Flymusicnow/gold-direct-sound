
## Plan: Lägg till Tags vid Track-uppladdning

### Bakgrund
Nuvarande uppladdningsformulär för enstaka låtar (Single Track Upload) saknar möjlighet att välja **genre**, **mood** och **tags**. Dessa fält finns endast:
- I **BulkMetadataEditor** (för multi-upload)
- I **EditTrackMetadataDialog** (för redigering efter uppladdning)

Artister måste idag ladda upp en låt först och sedan redigera den för att lägga till tags, vilket är ineffektivt.

### Nuvarande flöde
```text
Upload Form:
+---------------------------+
| Track Title *             |
| Description (optional)    |
| Cover Image (optional)    |
| Audio File *              |
| Supporter Exclusive       |
| [Upload Track]            |
+---------------------------+
```

### Nytt flöde (efter implementation)
```text
Upload Form:
+---------------------------+
| Track Title *             |
| Description (optional)    |
| Genre (dropdown)          | <-- NY
| Mood (dropdown)           | <-- NY
| Tags (chips + input)      | <-- NY
+---------------------------+
| Cover Image (optional)    |
| Audio File *              |
| Supporter Exclusive       |
| [Upload Track]            |
+---------------------------+
```

---

## Teknisk Implementation

### Del 1: Uppdatera StudioTracks.tsx

**Lägg till nya state-variabler:**
```typescript
const [trackGenre, setTrackGenre] = useState("");
const [trackMood, setTrackMood] = useState("");
const [trackTags, setTrackTags] = useState<string[]>([]);
```

**Lägg till metadata-fält i formuläret (efter Description):**
- Genre: Select-dropdown med fördefinierade genrer (Pop, Hip-Hop, R&B, etc.)
- Mood: Select-dropdown med fördefinierade moods (Energetic, Chill, Happy, etc.)
- Tags: Input-fält + chip-display för valda tags (samma mönster som EditTrackMetadataDialog)

**Uppdatera INSERT-query:**
```typescript
await supabase.from('tracks').insert({
  artist_id: artistProfile.id,
  title: trackTitle,
  description: trackDescription || null,
  audio_url: publicUrl,
  cover_url: coverUrl,
  is_supporter_only: isSupporterOnly,
  required_tier: isSupporterOnly ? requiredTier : null,
  genre: trackGenre || null,        // NY
  mood: trackMood || null,          // NY
  tags: trackTags.length > 0 ? trackTags : null  // NY
});
```

### Del 2: Återanvänd UI-komponenter

Extrahera genre/mood/tags UI från EditTrackMetadataDialog till en återanvändbar komponent:

**Ny komponent: `TrackMetadataFields.tsx`**
```typescript
interface TrackMetadataFieldsProps {
  genre: string;
  onGenreChange: (genre: string) => void;
  mood: string;
  onMoodChange: (mood: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}
```

Denna komponent kan sedan användas i:
- StudioTracks.tsx (single upload)
- EditTrackMetadataDialog.tsx
- BulkMetadataEditor.tsx (eventuellt)

### Del 3: Responsiv design (mobil)

- Säkerställ att Genre/Mood-selects fungerar bra på touch
- Tags-chips måste vara klickbara/raderbar på mobil
- Kompakt layout för mindre skärmar (stack vertikalt)

---

## Filer som påverkas

| Fil | Ändring |
|-----|---------|
| `src/pages/studio/StudioTracks.tsx` | Lägg till genre/mood/tags state och formulärfält |
| `src/components/artist/TrackMetadataFields.tsx` | **NY** - Återanvändbar komponent |
| `src/components/artist/EditTrackMetadataDialog.tsx` | Refaktorera att använda TrackMetadataFields |

---

## Konstanter (återanvänd existerande)

Genrer och moods finns redan definierade i EditTrackMetadataDialog.tsx:

```typescript
const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Rock", "Electronic", "Jazz", "Classical",
  "Country", "Folk", "Indie", "Metal", "Reggae", "Soul", "Blues", "Other"
];

const MOODS = [
  "Energetic", "Chill", "Happy", "Sad", "Romantic", "Aggressive",
  "Peaceful", "Motivational", "Dark", "Uplifting", "Melancholic", "Party"
];
```

---

## Definition of Done

- [ ] Artist kan välja genre via dropdown vid single track upload
- [ ] Artist kan välja mood via dropdown vid single track upload
- [ ] Artist kan lägga till tags (kommaseparerat eller via quick-add badges)
- [ ] Metadata sparas korrekt till databasen
- [ ] UI fungerar på både desktop och mobil
- [ ] Formuläret återställs korrekt efter lyckad uppladdning

---

## Övriga buggar som nämndes

Utöver tags-funktionen nämndes även:
1. **Community replies** - Önskan att kunna svara inline i community-fönstret utan att navigera bort
2. **Mission progress** - Likes räknas inte korrekt för "like tracks"-mission
3. **HTTP 406 errors** - spotlight_campaigns query-problem

Dessa bör hanteras som separata ärenden efter att tags-funktionen är implementerad.
