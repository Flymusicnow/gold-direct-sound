
# Fixplan: Feed-sidan passar inte på skärmen (mobil)

## Problem
Innehållet på /fan/feed-sidan skärs av på vänster sida på mobil. Texten visar:
- "tal > Feed" istället för "Portal > Feed"
- "w from your artists" istället för "New from your artists"
- "ay all (10)" istället för "Play all (10)"

Detta är ett horisontellt overflow-problem där sidan scrollar åt sidan.

## Orsak
Huvudcontainern i `FanFeed.tsx` saknar `overflow-x-hidden` vilket tillåter innehåll att sträcka sig utanför viewporten.

**Nuvarande kod (rad 279, 323):**
```tsx
<div className="flex min-h-screen w-full pt-16">
```

## Lösning
Lägg till `overflow-x-hidden` på huvudcontainern för att förhindra horisontell scroll.

### Fil att ändra: `src/pages/FanFeed.tsx`

**Ändring 1 - Loading state (rad 279):**
```tsx
// Före:
<div className="flex min-h-screen w-full pt-16">

// Efter:
<div className="flex min-h-screen w-full pt-16 overflow-x-hidden">
```

**Ändring 2 - Main content (rad 323):**
```tsx
// Före:
<div className="flex min-h-screen w-full pt-16">

// Efter:
<div className="flex min-h-screen w-full pt-16 overflow-x-hidden">
```

## Resultat
- Ingen horisontell scroll på mobil
- Allt innehåll visas korrekt inom viewport
- Breadcrumb, rubriker och knappar är fullt synliga

## Teknisk förklaring
`overflow-x-hidden` förhindrar att barn-element sträcker sig utanför containerns bredd, vilket eliminerar oönskad horisontell scrollning. Detta är standard-praxis för mobila layouter.
