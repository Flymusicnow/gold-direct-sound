
# Plan: Databasrensning + Mobil Layout Fix

## 1. Rensa gamla runtime_errors (30+ dagar)

**SQL-migration:**
```sql
DELETE FROM runtime_errors 
WHERE created_at < NOW() - INTERVAL '30 days';
```

**Resultat:** Tar bort 36 av 99 fel

---

## 2. Verifiera sökfunktionen

Sökfunktionen på `/search` ser komplett ut i koden:
- Stöder tracks, artists, videos, spotlight, stacks
- Har voice search
- Har sökhistorik och trending

**Rekommendation:** Manuell testning krävs för att verifiera

---

## 3. useLikes-fix (KLART)

Den defensiva fallback-mekanismen är redan implementerad:
- Hook returnerar nu ett säkert fallback-objekt istället för att krascha
- Påverkar: ArtistProfile, FlightdeckQueueSidebar, FlightdeckQueueDrawer

---

## 4. Mobil layout-fix (avklippt innehåll)

### Problem
Innehållet klipps av i botten på mobil (Safari) för att bottom padding är för liten.

### Analys
| Komponent | Nuvarande | Behövs |
|-----------|-----------|--------|
| Bottom nav | 64px | 64px |
| Spelar | ~100px | ~100px |
| Safari safe area | ~34px | ~34px |
| **Total** | - | **~200px** |

Nuvarande `pb-28` (112px) eller `pb-32` (128px) räcker inte.

### Lösning
Uppdatera bottom padding i berörda filer:

**Filer att ändra:**

| Fil | Nuvarande | Ny |
|-----|-----------|-----|
| `src/pages/FanFeed.tsx` | `pb-28 md:pb-8` | `pb-44 md:pb-8` |
| `src/pages/ArtistProfile.tsx` | `pb-32 md:pb-28` | `pb-44 md:pb-28` |

**Alternativ (bättre):** Skapa en CSS-variabel i `index.css`:
```css
.pb-player-nav-safe {
  padding-bottom: calc(7rem + var(--safe-area-bottom) + var(--player-height-mobile, 100px));
}
```

---

## Tekniska ändringar

| Typ | Fil/Query | Beskrivning |
|-----|-----------|-------------|
| SQL | Database migration | Ta bort runtime_errors > 30 dagar |
| CSS/TSX | FanFeed.tsx | Öka pb-28 → pb-44 |
| CSS/TSX | ArtistProfile.tsx | Öka pb-32 → pb-44 |
| CSS | index.css (valfritt) | Ny `.pb-player-nav-safe` klass |

---

## Prioritetsordning

1. **Databasrensning** - Enkel SQL delete
2. **Mobil layout-fix** - Ändra padding i 2 filer
3. **Testa sökning** - Manuell verifiering

