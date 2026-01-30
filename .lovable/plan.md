

# Plan: Flytta Spotlight Carousel till Sidebaren

## Problem
SpotlightCarousel visas centrerat på full-width toppen (efter hero) vilket ser "off" ut på desktop. Användaren föreslår att den ska vara i sidebaren för bättre fokus och flöde.

## Nuvarande Layout (Desktop)
```text
┌─────────────────────────────────────────────────┐
│               Hero Section                       │
├─────────────────────────────────────────────────┤
│       [SpotlightCarousel centrerad]             │  ← SER "OFF" UT
│              max-w-280px                         │
├─────────────────────────────────────────────────┤
│                                  │              │
│  ┌─────────────────────┐        │ Stats Card   │
│  │                     │        │              │
│  │    TABS Content     │        │ Spotlight    │
│  │ (Tracks, Videos...) │        │ Card (votes) │
│  │                     │        │              │
│  │                     │        │ Supporter    │
│  └─────────────────────┘        │ Button       │
│         (2/3)                   │    (1/3)     │
└─────────────────────────────────────────────────┘
```

## Ny Layout (Desktop)
```text
┌─────────────────────────────────────────────────┐
│               Hero Section                       │
├─────────────────────────────────────────────────┤
│                                  │              │
│  ┌─────────────────────┐        │[Spotlight    │  ← FÖRST I SIDEBAR
│  │                     │        │ Carousel]    │     MED FOKUS
│  │    TABS Content     │        │              │
│  │ (Tracks, Videos...) │        │ Stats Card   │
│  │                     │        │              │
│  │                     │        │ Spotlight    │
│  │                     │        │ Card (votes) │
│  └─────────────────────┘        │              │
│         (2/3)                   │    (1/3)     │
└─────────────────────────────────────────────────┘
```

## Ändringar

### Fil: `src/pages/ArtistProfile.tsx`

**Ändring 1:** Ta bort SpotlightSection från full-width toppen (rad 541-542)
```tsx
// TA BORT dessa rader:
{/* Spotlight / Pulse Carousel */}
<SpotlightSection artistId={artist.id} artistName={artist.artist_name} />
```

**Ändring 2:** Lägg till SpotlightSection först i sidebaren (rad 765-766)
```tsx
{/* Sidebar - 1/3 width on desktop */}
<div className="space-y-6">
  {/* Spotlight Carousel - FIRST in sidebar for focus */}
  <SpotlightSection artistId={artist.id} artistName={artist.artist_name} />
  
  {/* Artist Stats Card */}
  <ArtistStatsCard artistId={artist.id} />
  
  {/* ... resten oförändrat */}
```

### Fil: `src/components/spotlight/SpotlightSection.tsx`

**Ändring 3:** Ta bort container padding/max-width (anpassa för sidebar)
```tsx
// FÖRE:
return (
  <div className="container mx-auto px-4 py-6 max-w-6xl">
    <SpotlightCarousel ... />
  </div>
);

// EFTER:
return (
  <div className="w-full">
    <SpotlightCarousel ... />
  </div>
);
```

### Fil: `src/components/spotlight/SpotlightCarousel.tsx`

**Ändring 4:** Ta bort max-width begränsning (fyller sidebar-bredden)
```tsx
// FÖRE (rad 134):
<div className="w-full max-w-[280px] mx-auto">

// EFTER:
<div className="w-full">
```

## Resultat

- Spotlight Carousel visas i sidebaren på desktop (naturligt fokus)
- Fyller sidebar-bredden (~320px på lg breakpoint)
- Ligger före Stats och Votes för att vara "i fokus"
- På mobil (1-kolumn layout) visas allt i ordning vertikalt
- Behåller all befintlig funktionalitet (A/B test, analytics, links)

## Mobil-upplevelse

På mobil (under lg breakpoint) kollapsar griden till 1 kolumn där sidebaren-innehållet visas under tabs-innehållet. SpotlightCarousel kommer då visas efter Tabs men fortfarande i naturlig scroll-ordning.

Om ni vill ha Spotlight högre upp på mobil kan vi överväga conditional rendering, men nuvarande förslag håller koden enkel.

