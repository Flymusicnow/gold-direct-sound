

## Åtgärdsplan: Fixa RLS-policy för artist_goals INSERT

### Problemanalys

RLS-policyn "Artists can manage own goals" på `artist_goals`-tabellen saknar en explicit `WITH CHECK`-klausul för INSERT-operationer.

**Nuvarande policy:**
```
command: ALL (*)
USING: artist_id IN (SELECT artist_profiles.id FROM artist_profiles WHERE user_id = auth.uid())
WITH CHECK: null  <-- PROBLEMET
```

När `WITH CHECK` är null för en `ALL`-policy, används `USING`-uttrycket även för INSERT. Detta borde tekniskt fungera, men det kan finnas ett problem med hur PostgreSQL evaluerar subqueryn vid INSERT.

### Lösning

Skapa en explicit `WITH CHECK`-klausul som säkerställer att artisten bara kan skapa mål för sin egen profil:

```sql
-- Ta bort befintlig policy
DROP POLICY IF EXISTS "Artists can manage own goals" ON public.artist_goals;

-- Skapa ny policy med explicit WITH CHECK
CREATE POLICY "Artists can manage own goals" 
ON public.artist_goals
FOR ALL
TO authenticated
USING (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
);
```

### Teknisk förklaring

| Operation | Klausul som används |
|-----------|---------------------|
| SELECT | USING |
| UPDATE | USING (för befintliga rader) + WITH CHECK (för nya värden) |
| DELETE | USING |
| INSERT | **WITH CHECK** (obligatorisk) |

Genom att lägga till `WITH CHECK` med samma villkor som `USING`, tillåter vi artister att skapa nya mål där `artist_id` matchar deras egen artist-profil.

### Steg

1. **Kör SQL-migration** som droppar och återskapar policyn med båda klausulerna
2. **Verifiera** genom att skapa ett nytt mål i Studio

### Definition of Done

- RLS-policy har både USING och WITH CHECK
- Artist kan skapa nya mål i /studio/goals
- Befintlig säkerhet bibehålls (artister kan bara hantera sina egna mål)

