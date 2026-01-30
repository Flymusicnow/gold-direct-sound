
# Plan: Lägg till Kommentarer på Spotlight Entry-kort

## Designkoncept

En minimal, icke-störande kommentarsfunktion som följer samma mönster som Community posts - en klickbar ikon som expanderar en kompakt kommentarssektion direkt i kortet.

```text
┌─────────────────────────────────────────┐
│            [Cover Image]                 │
│                                          │
├─────────────────────────────────────────┤
│  LUST                                    │
│  TOPLINER                                │
│  Description text...                     │
│                                          │
│  2 votes   💬 3   📤   [♥ Voted]         │
│  ─────────────────────────────────────── │
│  (Expanderad kommentarssektion)          │
│  👤 Fan1: "Jättebra låt!"               │
│  👤 Artist: "Tack så mycket!"           │
│  [Skriv en kommentar...]         [Send]  │
└─────────────────────────────────────────┘
```

## Steg 1: Skapa Databas-tabell

Ny tabell `spotlight_entry_comments`:

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | UUID | Primärnyckel |
| entry_id | UUID | FK till spotlight_entries |
| user_id | UUID | Kommentarsförfattare |
| content | TEXT | Kommentarstext |
| created_at | TIMESTAMPTZ | Skapad tidpunkt |
| is_deleted | BOOLEAN | Soft delete |

Med RLS-policies:
- Alla kan läsa kommentarer
- Inloggade användare kan skapa
- Användare kan ta bort sina egna

## Steg 2: Skapa Kommentarskomponent

Ny fil: `src/components/spotlight/SpotlightEntryComments.tsx`

Funktioner:
- Hämtar och visar senaste 3 kommentarer
- Visar antal totala kommentarer
- Enkel input för att skriva ny kommentar
- Använder `public_profiles` view för namn/avatar (enligt identity-protocol)

## Steg 3: Uppdatera SpotlightEntryCard

Ändringar i `src/components/spotlight/SpotlightEntryCard.tsx`:

```tsx
// Lägg till state för kommentarer
const [commentsExpanded, setCommentsExpanded] = useState(false);
const [commentCount, setCommentCount] = useState(0);

// I footer, lägg till kommentarikon mellan Share och Vote:
<Button
  size="icon"
  variant="ghost"
  onClick={() => setCommentsExpanded(!commentsExpanded)}
  className={cn(commentsExpanded && "text-primary")}
>
  <MessageCircle className={cn("h-4 w-4", commentsExpanded && "fill-current")} />
  {commentCount > 0 && <span className="ml-1 text-xs">{commentCount}</span>}
</Button>

// Under footer, visa expanderbar kommentarssektion:
{commentsExpanded && (
  <SpotlightEntryComments 
    entryId={entry.id}
    onCommentAdded={() => setCommentCount(c => c + 1)}
  />
)}
```

## Steg 4: Real-time uppdateringar (valfritt)

Prenumerera på `spotlight_entry_comments` för live-uppdateringar när andra kommenterar.

## Visuell flöde

```text
Användare ser kort → Klickar på 💬 → Kommentarer expanderar smidigt
                                    ↓
                     Skriver kommentar → Skickar → Visas direkt
```

## Filer som skapas/ändras

| Fil | Åtgärd |
|-----|--------|
| Database migration | CREATE TABLE spotlight_entry_comments |
| `SpotlightEntryComments.tsx` | Ny komponent |
| `SpotlightEntryCard.tsx` | Lägg till kommentarstoggle och inline-sektion |

## UX-fördelar

- Stör inte kortets visuella känsla
- Kommentarer är dolda tills användaren aktivt klickar
- Följer etablerat mönster från Community feed
- Snabb, minimal interaktion
