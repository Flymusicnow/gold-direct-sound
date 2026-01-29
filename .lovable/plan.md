
## Åtgärdsplan: Fixa Goal-donationer, Anonymous-problem & UI-uppdateringar

### Identifierade Problem

**Problem 1: Goal-donationer visar 0 istället för 1000**
- Databasen visar: `goal_donations.amount = 1000` men `artist_goals.current_amount = 0`
- Rotorsak: Donationen gjordes INNAN `donate_to_goal` RPC-funktionen skapades
- Målets status är felaktigt satt till "completed" trots 0 progress

**Problem 2: Goal-kort visas inte på artistsidan**
- `useActiveGoal` hämtar endast mål med `status = 'active'`
- Eftersom målet har status "completed" (felaktigt), visas det inte

**Problem 3: Anonymous i StudioSubscription**
- `src/pages/studio/StudioSubscription.tsx` (rad 131-134) frågar `profiles`-tabellen direkt
- RLS blockerar åtkomst till andra användares profiler → fallback till "Anonymous"
- Bör använda `public_profiles` view istället

**Problem 4: Fan-sidan saknar donation-historik**
- Fan Dashboard visar ingen information om gjorda donationer

---

### Lösningar

#### Del 1: Datafix (SQL-migration)

Skapa en engångs-migration som:
1. Beräknar `current_amount` från faktiska donationer i `goal_donations`
2. Beräknar `supporter_count` (unika fans)
3. Justerar `status` baserat på om målet är uppfyllt eller inte

```sql
-- Synkronisera artist_goals med faktiska donationer
UPDATE artist_goals ag SET
  current_amount = COALESCE(
    (SELECT SUM(amount) FROM goal_donations WHERE goal_id = ag.id), 
    0
  ),
  supporter_count = COALESCE(
    (SELECT COUNT(DISTINCT fan_user_id) FROM goal_donations WHERE goal_id = ag.id), 
    0
  ),
  status = CASE 
    WHEN ag.status = 'completed' AND (SELECT SUM(amount) FROM goal_donations WHERE goal_id = ag.id) < ag.target_amount 
    THEN 'active'
    ELSE ag.status 
  END,
  updated_at = now();
```

#### Del 2: Fixa Anonymous i StudioSubscription

Uppdatera `src/pages/studio/StudioSubscription.tsx` rad 131-134:

**Före:**
```typescript
const { data: fanProfiles } = await supabase
  .from("profiles")
  .select("id, full_name, email")
  .in("id", fanIds);
```

**Efter:**
```typescript
const { data: fanProfiles } = await supabase
  .from("public_profiles")
  .select("id, full_name")
  .in("id", fanIds);
```

OBS: Tar bort `email` eftersom det är PII och inte ska exponeras.

#### Del 3: Uppdatera useActiveGoal för att hantera olika status

Modifiera `src/hooks/useActiveGoal.ts` för att:
1. Hämta aktiva mål (befintligt beteende)
2. Alternativt: Skapa en ny hook `useGoal(goalId)` för att visa specifika mål

#### Del 4: Lägg till Donation-historik på Fan Dashboard (valfritt)

Skapa en sektion i Fan Dashboard som visar:
- Vilka artister fanen har stöttat
- Totalt bidrag per artist
- Senaste donation

---

### Teknisk Implementationsordning

| Steg | Uppgift | Filer |
|------|---------|-------|
| 1 | SQL-migration för att synka goal-data | `supabase/migrations/` |
| 2 | Ändra StudioSubscription till public_profiles | `src/pages/studio/StudioSubscription.tsx` |
| 3 | Verifiera att goal-kortet visas | `src/components/artist/ArtistGoalCard.tsx` |
| 4 | (Valfritt) Lägg till donation-historik på Fan Dashboard | `src/pages/FanDashboard.tsx` |

---

### Definition of Done

- [x] `artist_goals.current_amount` visar faktiska 1000 FlyCoins ✅ DONE
- [x] `artist_goals.supporter_count` visar 1 supporter ✅ DONE
- [x] Goal-kortet visas på Topliners artistsida ✅ DONE (status=active)
- [x] Studio Goals visar rätt progress (1000/50000) ✅ DONE
- [x] StudioSubscription använder `public_profiles` (inget Anonymous) ✅ DONE
