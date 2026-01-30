

# Buggfix-plan: Community Replies, Mission Progress & HTTP 406 Errors

## Sammanfattning av buggar

| Bugg | Orsak | Prioritet |
|------|-------|-----------|
| Mission progress för likes | `updateMissionProgress` anropas aldrig | Hög |
| HTTP 406 på spotlight_campaigns | `.single()` returnerar 406 om 0 eller >1 rader | Medium |
| Community replies | UX-problem: användare missar inline-svar | Låg |

---

## Bugg 1: Mission Progress för Likes (KRITISK)

### Problemanalys
- Mission `daily_like_tracks` finns i databasen med `target_count: 3`
- `updateMissionProgress(missionKey)` finns i `useMissions.ts` men anropas **aldrig**
- `LikesContext.tsx` anropar `updateSupportScore` men inte `updateMissionProgress`

### Lösning
Integrera missions-uppdatering i LikesContext:

**Fil: `src/contexts/LikesContext.tsx`**

```typescript
// Lägg till import
import { useMissions } from '@/hooks/useMissions';

// I LikesProvider
const { updateMissionProgress } = useMissions();

// I toggleLike(), efter successful like:
if (!currentlyLiked) {
  // Like
  // ... befintlig kod ...
  
  // Uppdatera support score
  updateSupportScore(artistId, 'like_track');
  
  // NY: Uppdatera mission progress
  updateMissionProgress('daily_like_tracks');
}
```

### OBS: Circular Dependency Risk
`useMissions` anropar `useAuth` som inte finns i providers-kedjan innan `LikesProvider`. Kontrollera provider-ordning i `App.tsx`.

**Alternativ lösning (säkrare):**
Skapa en separat hook `useMissionTracker` som exponerar en enkel `trackAction(actionKey)` funktion:

```typescript
// src/hooks/useMissionTracker.ts
export function useMissionTracker() {
  const trackLike = useCallback(() => {
    // Direkt supabase-anrop utan att gå via useMissions context
  }, []);
  
  return { trackLike };
}
```

---

## Bugg 2: HTTP 406 Errors på spotlight_campaigns

### Problemanalys
- Flera komponenter använder `.single()` på spotlight_campaigns
- Om ingen aktiv kampanj finns returnerar `.single()` HTTP 406 (Not Acceptable)
- Påverkade filer:
  - `SpotlightTrendingCard.tsx`
  - `SpotlightRisingCard.tsx`
  - `SpotlightNewEntryCard.tsx`

### Lösning
Byt från `.single()` till `.maybeSingle()`:

**Före:**
```typescript
const { data: campaign } = await supabase
  .from('spotlight_campaigns')
  .select('id, name')
  .eq('status', 'active')
  .single(); // Fel om 0 eller >1 rader
```

**Efter:**
```typescript
const { data: campaign } = await supabase
  .from('spotlight_campaigns')
  .select('id, name')
  .eq('status', 'active')
  .maybeSingle(); // Returnerar null om 0 rader, error bara vid >1

if (!campaign) {
  setLoading(false);
  return; // Graceful exit
}
```

### Filer att uppdatera
| Fil | Rad | Ändring |
|-----|-----|---------|
| `src/components/spotlight/SpotlightTrendingCard.tsx` | 52 | `.single()` → `.maybeSingle()` |
| `src/components/spotlight/SpotlightRisingCard.tsx` | 58 | `.single()` → `.maybeSingle()` |
| `src/components/spotlight/SpotlightNewEntryCard.tsx` | 68 | `.single()` → `.maybeSingle()` |

---

## Bugg 3: Community Replies UX

### Nuvarande beteende (fungerar!)
1. Användaren klickar på kommentar-ikonen (💬)
2. `InlineComments` expanderar med senaste kommentarer
3. `CommentComposer` visas längst ner för att skriva svar
4. "View all X comments" navigerar till fullständig vy

### Användarens förväntning
"Man borde kunna trycka på pratbubblan för att se replies och kunna reply direkt i tråden i community-fönstret"

### Analys
Funktionen finns redan! Men det kan finnas UX-förbättringar:
1. Kommentar-ikonen kanske inte är tillräckligt synlig
2. Användaren förväntar sig kanske att kommentarer visas direkt utan klick

### Föreslagna UX-förbättringar
1. **Visa kommentarantal tydligare** - Lägg till tooltip "Click to view replies"
2. **Auto-expand vid få kommentarer** - Om < 3 kommentarer, visa dem direkt
3. **Visuell feedback** - Animera expandering mjukt

**Fil: `src/components/community/PostCard.tsx`**

```typescript
// Lägg till tooltip på kommentar-knappen
<Button 
  variant="ghost" 
  size="sm" 
  className={cn("gap-2", isCommentsExpanded && "text-primary")}
  onClick={handleCommentToggle}
  title="Click to view and add comments" // NY
>
  <MessageCircle className={cn("h-4 w-4", isCommentsExpanded && "fill-current")} />
  <span>{displayCommentCount}</span>
</Button>
```

---

## Implementationsordning

| Steg | Uppgift | Komplexitet |
|------|---------|-------------|
| 1 | Fixa HTTP 406 (`.maybeSingle()`) | Enkel |
| 2 | Integrera mission progress i LikesContext | Medium |
| 3 | UX-förbättringar för community | Enkel |

---

## Definition of Done

- [ ] Likes uppdaterar mission progress (`daily_like_tracks`)
- [ ] Toast visar "+1 progress" vid like (synlig feedback)
- [ ] Inga HTTP 406 errors vid avsaknad av aktiv spotlight-kampanj
- [ ] Kommentar-knappen har tydlig affordance (tooltip)
- [ ] Alla ändringar fungerar på både desktop och mobil

