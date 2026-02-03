
# Add Missing i18n Keys + Fix Bullet Points

## Summary

Add 14 missing translation keys to enable the StudioEarnings page to render correctly, plus fix hardcoded bullet characters.

---

## Changes

### 1. Swedish Translations (`src/i18n/sv.ts`)

**Studio namespace** (insert after line 788, near `noPayouts`):

```typescript
earningsDescription: 'Se dina intäkter och hantera utbetalningar',
lifetimeRevenue: 'Totalt intjänat sedan start',
pendingPayoutTooltip: 'Det här beloppet är redo att ingå i nästa utbetalningscykel.',
availableForWithdrawal: 'Tillgängligt för nästa utbetalning',
lastPayout: 'Senaste utbetalning',
mostRecent: 'Senast utbetald',
noPayoutsYet: 'Inga utbetalningar ännu',
howPayoutsWork: 'Så fungerar utbetalningar',
revenueSplit: 'Intäktsfördelning',
revenueSplitTooltip: 'För standard supporter-interaktioner får du 85% av intäkterna. FlyMusic tar 15% för att täcka plattformskostnader.',
payoutBullet1: 'För supporter-interaktioner går 85% av intäkterna direkt till dig',
payoutBullet2: 'Utbetalningar sker månadsvis när ditt saldo överstiger 100 kr',
payoutBullet3: 'Anslut en utbetalningsmetod för att ta emot pengar',
payoutBullet4: 'Intäkter visas i realtid i din dashboard',
```

**Empty namespace** (add before line 1229):

```typescript
noPayouts: 'Inga utbetalningar att visa',
```

### 2. English Translations (`src/i18n/en.ts`)

**Studio namespace** (insert after line 819, near `noPayouts`):

```typescript
earningsDescription: 'View your earnings and manage payouts',
lifetimeRevenue: 'Total earned since start',
pendingPayoutTooltip: 'This amount is ready to be included in the next payout cycle.',
availableForWithdrawal: 'Available for next payout',
lastPayout: 'Last payout',
mostRecent: 'Most recent',
noPayoutsYet: 'No payouts yet',
howPayoutsWork: 'How payouts work',
revenueSplit: 'Revenue split',
revenueSplitTooltip: 'For standard supporter interactions, you receive 85% of the revenue. FlyMusic takes 15% to cover platform costs.',
payoutBullet1: 'For supporter interactions, 85% of the revenue goes directly to you',
payoutBullet2: 'Payouts are processed monthly once your balance exceeds 100 SEK',
payoutBullet3: 'Connect a payout method to receive payments',
payoutBullet4: 'Earnings update in real time in your dashboard',
```

**Empty namespace** (add before line 1260):

```typescript
noPayouts: 'No payouts to display',
```

### 3. Remove Hardcoded Bullets (`src/pages/studio/StudioEarnings.tsx`)

Lines 185-188: Remove `• ` prefix from list items:

```tsx
// Before
<li>• {t('studio.payoutBullet1')}</li>
// After
<li>{t('studio.payoutBullet1')}</li>
```

---

## Files Changed

| File | Action |
|------|--------|
| `src/i18n/sv.ts` | Add 14 studio keys + 1 empty key |
| `src/i18n/en.ts` | Add 14 studio keys + 1 empty key |
| `src/pages/studio/StudioEarnings.tsx` | Remove `• ` from 4 list items |

---

## Acceptance Criteria

- No raw i18n keys visible on StudioEarnings page
- All labels render correctly in SV and EN
- Bullet list renders with native styling (no hardcoded `•`)
- Copy matches FlyMusic Economy Canon
