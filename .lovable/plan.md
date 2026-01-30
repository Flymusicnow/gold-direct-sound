

# Plan: Redesign Fan Feed med tydlig struktur och visuell hierarki

## Nuvarande problem (baserat på screenshots)

1. **Spretig layout** - Många separata Card-sektioner utan tydlig gruppering
2. **Blandad innehållstyp** - Tracks, videos, spotlight, events blandas utan logik
3. **Ingen visuell hierarki** - Allt ser lika viktigt ut
4. **Svårt att navigera** - För många sektioner att scrolla igenom
5. **Inkonsekvent kortdesign** - Olika storlekar och stilar

## Ny struktur: "Tab-baserad Feed"

Istället för en lång lista med alla sektioner, introducera en horisontell tab-navigation som filtrerar innehållet:

```text
┌─────────────────────────────────────────────────────────────┐
│  🔥 Your Feed                          [Dashboard | Feed]   │
│  Discover what's new from your favorite artists             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [ 🎵 Music ]  [ 📹 Videos ]  [ ⭐ Spotlight ]  [ 🎤 Artists ]│
└─────────────────────────────────────────────────────────────┘

  Unified Feed (vald tab)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  (Innehåll baserat på vald tab)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Design per tab

### Tab 1: Music (Default)

Visar nya låtar från följda artister i ett snyggt kortformat:

```text
┌─────────────────────────────────────────────────────────────┐
│  ▶ Play All (12 tracks)                    [Sort: Newest ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  Title of the Track                          │
│  │  Cover   │  Artist Name • 2h ago                        │
│  │   ▶      │  [♥] [+Queue] [...]                          │
│  └──────────┘                                              │
│                                                             │
│  ┌──────────┐  Another Track Title                         │
│  │  Cover   │  Different Artist • 5h ago                   │
│  │   ▶      │  [♥] [+Queue] [...]                          │
│  └──────────┘                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab 2: Videos

Visar videor i ett grid-format med konsekvent storlek:

```text
┌─────────────────────────────────────────────────────────────┐
│  Videos from your artists                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐                    │
│  │                │  │                │                    │
│  │   Video 1      │  │   Video 2      │                    │
│  │                │  │                │                    │
│  │ Artist • 2h    │  │ Artist • 5h    │                    │
│  └────────────────┘  └────────────────┘                    │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │   Video 3      │  │   Video 4      │                    │
│  └────────────────┘  └────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Tab 3: Spotlight

Fokuserat på Spotlight-innehåll med tydlig rankning:

```text
┌─────────────────────────────────────────────────────────────┐
│  ⭐ Trending in Spotlight              [Vote Now →]         │
├─────────────────────────────────────────────────────────────┤
│  🥇  Track Name - Artist          1,234 votes   [▶] [Vote] │
│  🥈  Track Name - Artist            987 votes   [▶] [Vote] │
│  🥉  Track Name - Artist            654 votes   [▶] [Vote] │
│  4.  Track Name - Artist            432 votes   [▶] [Vote] │
│  5.  Track Name - Artist            321 votes   [▶] [Vote] │
├─────────────────────────────────────────────────────────────┤
│  New Entries This Week                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  Entry   │ │  Entry   │ │  Entry   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Tab 4: Artists

Upptäck och hantera artistrelationer:

```text
┌─────────────────────────────────────────────────────────────┐
│  🎤 Your Artists                                            │
├─────────────────────────────────────────────────────────────┤
│  Following (23)                         [See All →]         │
│  ○ ○ ○ ○ ○ (horisontell scroll av avatarer)                │
├─────────────────────────────────────────────────────────────┤
│  Recommended For You                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ Avatar  │ │ Avatar  │ │ Avatar  │                       │
│  │ Name    │ │ Name    │ │ Name    │                       │
│  │[Follow] │ │[Follow] │ │[Follow] │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Sidebar (Desktop) - Förenklad

Sidebar behålls men förenklas till endast essentiellt:

```text
┌───────────────────────┐
│  ⭐ Top 10 Now         │
│  (kompakt leaderboard) │
├───────────────────────┤
│  📅 Upcoming Events    │
│  (nästa 3 events)      │
├───────────────────────┤
│  🏆 Your Stats         │
│  Votes: 45             │
│  Artists: 23           │
└───────────────────────┘
```

## Tekniska ändringar

### Ny komponent: `FeedTabs.tsx`

```tsx
type FeedTab = 'music' | 'videos' | 'spotlight' | 'artists';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  counts: { music: number; videos: number };
}

// Horisontellt scrollbar med animerad underline
```

### Uppdaterad `FanFeed.tsx`

1. Lägg till tab-state: `const [activeTab, setActiveTab] = useState<FeedTab>('music')`
2. Rendera endast relevant innehåll baserat på tab
3. Behåll sidebar med förenklad info
4. Lazy-load innehåll per tab

### Ny komponent: `FeedMusicTab.tsx`

- Renderar tracks med förbättrad TrackCard
- Play All-funktion
- Sorteringsalternativ

### Ny komponent: `FeedVideosTab.tsx`

- Grid-layout med 2 kolumner
- Kompaktare VideoPostCard
- Lazy loading

### Ny komponent: `FeedSpotlightTab.tsx`

- Trending leaderboard
- New entries carousel
- Rising stars sektion

### Ny komponent: `FeedArtistsTab.tsx`

- Following carousel
- Recommendations grid
- Live now indicator

## Mobil-specifika förbättringar

1. **Sticky tabs** - Tabs fastnar under header vid scroll
2. **Swipe between tabs** - Touch-vänlig navigation
3. **Kompakta kort** - Mindre padding, tightare layout
4. **Bottom sheet** - För track-actions istället för inline-knappar

## Visuella förbättringar

1. **Konsekvent kortdesign** - Alla kort använder samma border-radius, skugga
2. **Tydlig hierarki** - Större rubriker, bättre spacing
3. **Gold accent** - Använd primary-färgen mer konsekvent
4. **Micro-animationer** - Tab-övergångar, like-animationer

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/components/feed/FeedTabs.tsx` | Ny |
| `src/components/feed/FeedMusicTab.tsx` | Ny |
| `src/components/feed/FeedVideosTab.tsx` | Ny |
| `src/components/feed/FeedSpotlightTab.tsx` | Ny |
| `src/components/feed/FeedArtistsTab.tsx` | Ny |
| `src/components/feed/CompactVideoCard.tsx` | Ny |
| `src/pages/FanFeed.tsx` | Uppdatera med tabs |

## Sammanfattning

| Före | Efter |
|------|-------|
| 6+ separata sektioner | 4 fokuserade tabs |
| Lång scroll | Filtrerat innehåll |
| Blandade storlekar | Konsekvent design |
| Överväldigande | Organiserat och tydligt |

