

# Waitlist Badge i Admin-sidebaren

## Sammanfattning

Lägg till en notifikationsbadge på Waitlist-menyalternativet i admin-sidebaren som visar antalet nya registreringar (status = "pending"), precis som Inbox visar antal olästa meddelanden.

---

## Ändringar

### Fil: `src/components/admin/AdminSidebar.tsx`

**1. Uppdatera Waitlist-menyalternativet (rad ~177-181):**

Lägg till `badgeType: 'waitlist'` till Waitlist-objektet:

```typescript
{ 
  title: "Waitlist", 
  url: "/admin/waitlist", 
  icon: Mail,
  badgeType: 'waitlist' as const,  // NY RAD
  description: "Se väntelistan med registrerade intressenter. Bjud in och prioritera användare"
},
```

**2. Lägg till state för waitlist-count (rad ~227):**

```typescript
const [waitlistCount, setWaitlistCount] = useState(0);
```

**3. Uppdatera fetchCounts-funktionen (rad ~230-258):**

Lägg till hämtning av pending waitlist-entries:

```typescript
// Fetch pending waitlist signups count
const { count: pendingWaitlist } = await supabase
  .from("beta_waitlist")
  .select("*", { count: "exact", head: true })
  .eq("status", "pending");

setWaitlistCount(pendingWaitlist || 0);
```

**4. Uppdatera getBadgeInfo-funktionen (rad ~269-277):**

Lägg till hantering av waitlist badge:

```typescript
const getBadgeInfo = (badgeType?: 'inbox' | 'brand' | 'waitlist') => {
  if (badgeType === 'inbox' && totalInboxActive > 0) {
    return { count: totalInboxActive, isUrgent: hasUnread };
  }
  if (badgeType === 'brand' && brandAppCount > 0) {
    return { count: brandAppCount, isUrgent: true };
  }
  if (badgeType === 'waitlist' && waitlistCount > 0) {
    return { count: waitlistCount, isUrgent: true };
  }
  return null;
};
```

---

## Resultat

| Visning | Beskrivning |
|---------|-------------|
| Desktop (expanderad) | Röd badge med antal bredvid "Waitlist" |
| Desktop (minimerad) | Liten röd prick i hörnet av ikonen |
| Mobil | Samma som desktop |

Badgen uppdateras automatiskt var 30:e sekund (samma interval som Inbox).

---

## Filer att ändra

| Fil | Åtgärd |
|-----|--------|
| `src/components/admin/AdminSidebar.tsx` | Lägg till waitlist badge |

---

## Acceptanskriterier

- Waitlist-menyalternativet visar en röd badge med antal nya registreringar
- Badgen uppdateras automatiskt var 30:e sekund
- Badgen visas korrekt både i expanderat och minimerat läge
- Antal matchar faktiska `pending` entries i `beta_waitlist`-tabellen
- Fungerar på både desktop och mobil

