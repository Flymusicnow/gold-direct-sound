

## Åtgärdsplan: Fixa tre kritiska buggar

### Problem 1: Goal-donationer uppdateras inte (0 points visas)

**Rotorsak:**
Donationen sparas i `goal_donations` (1000 FlyCoins finns i databasen), MEN `artist_goals.current_amount` förblir 0 eftersom RLS-policyn endast tillåter **artisten** att uppdatera sina mål. En fan kan inte köra UPDATE på `artist_goals`.

**Data från databasen:**
```
goal_donations: amount=1000, fan_user_id=f5ebe..., goal_id=8642dbde...
artist_goals: current_amount=0, supporter_count=0 ← Inte uppdaterad!
```

**Lösning:**
Skapa en database function med `SECURITY DEFINER` som hanterar donationslogiken atomärt. Funktionen körs med behörigheterna hos skaparen (dvs. kan uppdatera `artist_goals`) medan den fortfarande validerar att anroparen är inloggad.

```sql
CREATE OR REPLACE FUNCTION public.donate_to_goal(
  p_goal_id UUID,
  p_amount INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_goal RECORD;
  v_is_first_donation BOOLEAN;
BEGIN
  -- Validera inloggning
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Hämta målet
  SELECT * INTO v_goal FROM artist_goals WHERE id = p_goal_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found or not active');
  END IF;

  -- Kolla om första donationen
  SELECT NOT EXISTS(
    SELECT 1 FROM goal_donations 
    WHERE goal_id = p_goal_id AND fan_user_id = v_user_id
  ) INTO v_is_first_donation;

  -- Lägg till donation
  INSERT INTO goal_donations (goal_id, fan_user_id, amount)
  VALUES (p_goal_id, v_user_id, p_amount);

  -- Uppdatera goal
  UPDATE artist_goals SET
    current_amount = current_amount + p_amount,
    supporter_count = CASE WHEN v_is_first_donation THEN supporter_count + 1 ELSE supporter_count END,
    status = CASE WHEN current_amount + p_amount >= target_amount THEN 'completed' ELSE status END,
    completed_at = CASE WHEN current_amount + p_amount >= target_amount THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_goal_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
```

**Kodändring:**
Uppdatera `useActiveGoal.ts` för att anropa `supabase.rpc('donate_to_goal', {...})` istället för manuella INSERT/UPDATE.

---

### Problem 2: Likes synkroniseras inte mellan vyer

**Rotorsak:**
Varje komponent (ArtistProfile, FlightdeckQueueSidebar) hämtar likes separat och lagrar dem i lokal React state (`useState`). När en like ändras på ett ställe, vet inte andra komponenter om det.

**Lösning:**
Skapa en **global LikesContext** som centraliserar like-state och synkroniserar ändringar över alla komponenter. Alternativt använda React Query med `invalidateQueries` för att trigga refetch överallt.

**Steg:**
1. Skapa `src/contexts/LikesContext.tsx` med global state
2. Exponera `toggleLike(trackId)` och `isLiked(trackId)` funktioner
3. Uppdatera alla komponenter att använda kontexten istället för lokal state
4. Lägg till realtime subscription för likes-tabellen

---

### Problem 3: Top Supporters visar "Anonymous"

**Rotorsak:**
Koden i `ArtistProfile.tsx` (rad 389-392) hämtar profiler från `profiles`-tabellen:
```typescript
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, email')
  .in('id', fanUserIds);
```

MEN RLS på `profiles` blockerar åtkomst till andras profiler (privacy/security). Fälten returneras som `null` → fallback till "Anonymous".

**Lösning:**
Använd `public_profiles` view som redan finns och är designad för detta:
```typescript
const { data: profiles } = await supabase
  .from('public_profiles')
  .select('id, full_name')
  .in('id', fanUserIds);
```

Samma ändring behövs i `TopSupportersWidget.tsx`.

---

## Implementationsordning

| Steg | Uppgift | Komplexitet |
|------|---------|-------------|
| 1 | Skapa `donate_to_goal` database function | Medium |
| 2 | Uppdatera `useActiveGoal.ts` att använda RPC | Låg |
| 3 | Fixa "Anonymous" - byt till `public_profiles` | Låg |
| 4 | Skapa LikesContext för global synkronisering | Hög |
| 5 | Migrera komponenter till LikesContext | Medium |

---

## Definition of Done

- [ ] Fan kan donera och siffrorna uppdateras direkt på sidan
- [ ] Top Supporters visar riktiga namn (från public_profiles)
- [ ] Like på ett ställe synkroniseras till alla andra vyer

