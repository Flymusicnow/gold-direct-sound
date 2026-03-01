
# Global Home Feed — "FlyMusic er levende"

## Hva dette er

En ekte **Global Feed** som erstatter `/fan/dashboard` som første side etter innlogging. Feeden er kronologisk, filtrerbar, og aggregerer community-posts + videos fra alle artister (ikke bare de du følger). Den er doomscroll-vennlig men transparent — ingen svart boks, ingen skjulte rank-signaler i Wave 1.

---

## Navigasjonsstruktur (ny)

```text
Bottom Nav (Fan):
  🏠 Home     → /home          (Global Feed — NYE SIDE)
  📡 Feed     → /fan/feed      (Dine artister — eksisterende)
  🔍 Explore  → /explore       (Artist discovery — eksisterende)
  ☰  More     → Sheet
```

`/fan/dashboard` beholdes som rute men `Home`-kortet i bunnavigasjon peker nå på `/home`.

---

## Hva den globale feeden viser

Innhold aggregert fra to tabeller:
- `community_posts` (artist posts) — via `communities` → `artist_profiles`
- `artist_video_posts` — direkte fra `artist_profiles`

Kun `tier_required = 'free'` vises i global feed (paywalled posts vises ikke globalt).

Filter-chips øverst:
- **All** (default)
- **Posts** (community_posts type)
- **Videos** (artist_video_posts type)
- **New Artists** (artister opprettet siste 30 dager)
- **Trending** (siste 24h / 7 dager — transparently defined)

---

## Datastruktur — ingen ny tabell nødvendig

Feed bygges direkte fra eksisterende tabeller med to parallelle queries:

```ts
// Query 1: Community posts (free tier only)
supabase
  .from('community_posts')
  .select('id, content, media_urls, created_at, reaction_count, comment_count, author_type, communities!inner(artist_id, artist_profiles!inner(id, artist_name, avatar_url, user_id, created_at))')
  .eq('tier_required', 'free')
  .eq('is_archived', false)
  .order('created_at', { ascending: false })
  .limit(20)

// Query 2: Video posts
supabase
  .from('artist_video_posts')
  .select('id, video_url, caption, thumbnail_url, like_count, view_count, created_at, artist_profiles!inner(id, artist_name, avatar_url, user_id, created_at)')
  .order('created_at', { ascending: false })
  .limit(20)
```

Resultater merges og sorteres etter `created_at` på klienten.

---

## Filer som endres / opprettes

| Fil | Endring |
|-----|---------|
| `src/pages/Home.tsx` (ny fil) | Global Feed page — ny side på `/home` |
| `src/hooks/useGlobalFeed.ts` (ny fil) | Data-fetching hook for merged feed |
| `src/components/feed/GlobalFeedCard.tsx` (ny fil) | Unified card for post + video items |
| `src/components/feed/GlobalFeedFilters.tsx` (ny fil) | Filter chips: All/Posts/Videos/New Artists/Trending |
| `src/components/mobile/BottomNavBarFan.tsx` | `Home` → `/home`, `Feed` beholdes |
| `src/App.tsx` | Legg til `<Route path="/home" element={<GlobalHomeFeed />} />` |
| Database | Legg til `global_feed_enabled` og relaterte toggles i `feature_flags` |

---

## Side: `/home` — GlobalHomeFeed

Layout følger Unified Layout Contract:
- `pt-16` topp, `pb-52` bunnpadding for mobile player
- Sticky filter-chips under topnav
- Infinite scroll med IntersectionObserver
- "New content" pill (ikke hopp feeden) når nye posts kommer

### Skjelett-struktur:
```tsx
<>
  <MobileFanNav />
  <div className="flex w-full pt-16 min-h-[100dvh]">
    <FanSidebar />
    <main className="flex-1 overflow-y-auto pb-52 md:pb-8">
      {/* Sticky header + filter chips */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b">
        <h1>Home</h1>
        <GlobalFeedFilters activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto space-y-4 px-4 pt-4">
        {items.map(item => <GlobalFeedCard key={item.id} item={item} />)}
        <div ref={loadMoreRef} />
      </div>
    </main>
  </div>
  <BottomNavBarFan />
</>
```

---

## GlobalFeedCard — card-design

For **posts**:
```text
┌────────────────────────────────────┐
│ [Avatar] ArtistName  · 2h          │
│                                    │
│ Post content text here...          │
│ [image if media_urls present]      │
│                                    │
│ ❤️ 12   💬 4   ➕ Følg   ↗ Del    │
└────────────────────────────────────┘
```

For **videos**:
```text
┌────────────────────────────────────┐
│ [Avatar] ArtistName  · 2h          │
│                                    │
│ ┌──────────────────────────────┐   │
│ │  [Video thumbnail 16:9]      │   │
│ │  ▶ play overlay              │   │
│ └──────────────────────────────┘   │
│ Caption text                       │
│ 👁 1.2k   ❤️ 34   ↗ Del          │
└────────────────────────────────────┘
```

Actions:
- **Reaction** (❤️ tap → reaction pop animation per motion system)
- **Comments** → opens sheet/drawer (ikke ny side)
- **Follow** — vises bare hvis fan ikke følger artisten ennå
- **Share** → native Web Share API, fallback copy-link

---

## Hook: useGlobalFeed

```ts
interface GlobalFeedItem {
  id: string;
  type: 'post' | 'video';
  createdAt: string;
  artistId: string;
  artistName: string;
  artistAvatar: string | null;
  artistUserId: string;
  // Post-specific
  content?: string;
  mediaUrls?: string[];
  reactionCount?: number;
  commentCount?: number;
  // Video-specific
  videoUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  likeCount?: number;
  viewCount?: number;
}
```

Merger posts + videos, sorterer etter `createdAt DESC`, paginerer med cursor. Filter-logikken skjer i hook: `activeFilter` bestemmer hvilke queries som kjøres.

**Trending-filter**: Henter items der `created_at > NOW() - 7 days` sortert etter `reaction_count + comment_count` for posts, `like_count + view_count` for videos.

**New Artists-filter**: Henter artist_profiles med `created_at > NOW() - 30 days` og viser deres siste post/video.

---

## Micro-interactions (per motion system)

- **Hover-lift** på cards: `transition-transform duration-200 hover:-translate-y-0.5`
- **Reaction pop**: scale 1 → 1.3 → 1 over 200ms, soft easing
- **New content pill**: slides in from top with `translate-y` animation, fade-in
- **Card enter**: `opacity-0 translate-y-2` → `opacity-1 translate-y-0` over 180ms, staggered per item
- **Follow button**: instant state update (optimistic), confirmatory glow

---

## Feature flags som legges til i database

```json
{
  "global_feed_enabled": true,
  "global_feed_filters_enabled": true,
  "global_feed_video_mode_enabled": true,
  "global_feed_trending_view_enabled": true,
  "global_feed_personalization_enabled": false,
  "global_feed_algorithmic_ranking_enabled": false
}
```

Implementert som ON/OFF type i eksisterende `FeatureFlagKey` union.

---

## Moderation (fra dag 1)

`GlobalFeedCard` har alltid en rapporter-knapp (skjult under "..." meny) som poster til eksisterende `report`-flyt. Rate limiting håndteres av eksisterende backend-logikk.

---

## Hva som IKKE endres

- `/fan/feed` forblir uendret (din personlige feed fra artister du følger)
- `/discover` forblir uendret (algoritmisk/kurert discovery)
- `/explore` forblir uendret
- `ArtistProfile` community-tab forblir uendret
- All eksisterende navigasjon for artist/admin forblir

---

## Resultat

Etter denne endringen:
- En fan som logger inn ser **Global Feed** som første side — levende, scrollbart, real content
- Bottom nav: Home (global) | Feed (dine) | Explore | More
- Feeden er gjennomsiktig: filter-chips er tydelige, "Trending" er definert, ingen skjult rangering
- Community-aktivitet fra artister gir effekt i global feed → `LISTEN → ACT → SEE EFFECT → BELONG`
- Wave 2 personalisering og algoritmisk rangering er flagged OFF, klar til å skrus på
