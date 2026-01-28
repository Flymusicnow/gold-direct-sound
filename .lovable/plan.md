

## Åtgärdsplan: Aktivera Artist Goals-modulen

### Problem
Feature-flaggan `ARTIST_GOALS` saknas i `feature_flags`-tabellen. Detta gör att hela Goals-modulen blockeras trots att koden är på plats.

### Lösning
Skapa feature-flaggan i databasen med `is_enabled = true` så att modulen blir synlig.

---

### Steg 1: Skapa feature-flag i databasen

Kör en SQL-migration som lägger till `ARTIST_GOALS` i `feature_flags`-tabellen:

```sql
INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  enabled_for_free,
  enabled_for_pro,
  enabled_for_elite,
  enabled_for_artists,
  enabled_for_brands,
  requires_subscription,
  requires_legal_approval,
  requires_payment_setup,
  config
) VALUES (
  'ARTIST_GOALS',
  'Artist Goals',
  'Enable the Artist Goals funding feature for artists to create and manage funding goals',
  true,
  true,
  true,
  true,
  '[]'::jsonb,
  false,
  false,
  false,
  false,
  '{}'::jsonb
);
```

---

### Steg 2: Verifiera att allt fungerar

Efter migrationen:
1. Navigera till **My Studio** → "Goals" ska nu visas under Monetize-sektionen
2. Klicka på "Goals" → StudioGoals-sidan ska visa skapa-mål-gränssnittet (inte "Coming Soon")
3. Skapa ett mål med status "active"
4. Navigera till din artistsida → ArtistGoalCard ska visas mellan hero och tabs

---

### Tekniska detaljer

**Vad som redan finns på plats:**
| Komponent | Status | Plats |
|-----------|--------|-------|
| Navigation | ✅ Redo | `src/config/navigation.ts` rad 148 |
| StudioGoals-sida | ✅ Redo | `src/pages/studio/StudioGoals.tsx` |
| ArtistGoalCard | ✅ Redo | `src/components/artist/ArtistGoalCard.tsx` |
| GoalDonationModal | ✅ Redo | `src/components/artist/GoalDonationModal.tsx` |
| useArtistGoals hook | ✅ Redo | `src/hooks/useArtistGoals.ts` |
| useActiveGoal hook | ✅ Redo | `src/hooks/useActiveGoal.ts` |
| Databastabeller | ✅ Redo | `artist_goals`, `goal_donations` |
| i18n (EN/SV) | ✅ Redo | Översättningar finns |

**Vad som saknas:**
| Komponent | Status | Åtgärd |
|-----------|--------|--------|
| Feature flag i DB | ❌ Saknas | Kör INSERT-migration |

---

### Definition of Done

- [ ] `ARTIST_GOALS` finns i `feature_flags` med `is_enabled = true`
- [ ] "Goals" är synlig i Studio-menyn under Monetize
- [ ] `/studio/goals` visar skapargränssnittet
- [ ] Aktivt mål visas på artistprofilen

