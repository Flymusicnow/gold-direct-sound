
# Plan: Fixa Artistnamn i Kommentarer + Admin Inbox Scroll

## Problem 1: Artistnamn visas som personnamn (Johan Kallén istället för Gung Kungen)

### Rotorsak
När kommentarer hämtas så inkluderas inte `artist_name` från `artist_profiles`:

```
Nuvarande:
.select('id, user_id')  ← saknar artist_name!

Sedan används:
profile?.full_name || 'Artist'  ← personnamn från public_profiles
```

### Påverkade filer

```text
┌─────────────────────────────────────────────────────────────┐
│           ARTISTNAMN MÅSTE HÄMTAS FRÅN artist_profiles       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ useAuthorIdentity.ts (Community posts)                  │
│     └── Hämtar artist_name korrekt                          │
│                                                             │
│  ❌ CommentsSection.tsx (rad 114-118)                       │
│     └── Saknar artist_name i select                         │
│                                                             │
│  ❌ CommentItem.tsx (rad 172-176)                           │
│     └── Saknar artist_name i select                         │
│                                                             │
│  ❌ VideoCommentsSection.tsx (rad 91-94)                    │
│     └── Saknar artist_name i select                         │
│                                                             │
│  ❌ getCommentAuthorInfo() (lib/utils/commentAuthor.ts)     │
│     └── Tar inte emot artistName parameter                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Lösning

**Steg 1:** Uppdatera `getCommentAuthorInfo` att ta emot artistnamn

```tsx
// lib/utils/commentAuthor.ts
export function getCommentAuthorInfo(
  profile: CommentProfile | null | undefined,
  isCommenterArtist: boolean,
  commenterArtistId: string | null | undefined,
  artistName?: string | null  // NY parameter
): CommentAuthorInfo {
  // ...
  if (isCommenterArtist && safeArtistId) {
    return {
      authorType: 'artist',
      authorArtistId: safeArtistId,
      displayName: artistName?.trim() || profile?.full_name?.trim() || 'Artist',  // Prioritera artistnamn
      isNavigable: true,
      targetPath: `/artist/${safeArtistId}`,
    };
  }
  // ...
}
```

**Steg 2:** Uppdatera CommentsSection.tsx

```tsx
// Hämta artist_name
const { data: artistProfiles } = await supabase
  .from('artist_profiles')
  .select('id, user_id, artist_name')  // LÄGG TILL artist_name
  .in('user_id', userIds)
  .eq('status', 'approved');

// Skapa map med både id och namn
const artistMap = new Map(
  artistProfiles?.map(a => [a.user_id, { id: a.id, name: a.artist_name }]) || []
);

// Sätt commenterArtistName
commenterArtistName: artistMap.get(comment.user_id)?.name || null,
```

**Steg 3:** Samma ändring i CommentItem.tsx (för replies)

**Steg 4:** Samma ändring i VideoCommentsSection.tsx

---

## Problem 2: Admin Inbox Scroll-restoration

### Rotorsak
När man klickar på en issue i Admin Inbox och sedan går tillbaka, så scrollas listan till toppen istället för där man var.

### Lösning
Spara scroll-position i sessionStorage för `/admin/inbox`-routen.

**Fil: AdminInbox.tsx**

```tsx
// Lägg till useRef och useEffect för scroll-restoration
import { useRef, useEffect } from 'react';

// I komponenten:
const scrollContainerRef = useRef<HTMLDivElement>(null);
const SCROLL_KEY = 'admin-inbox-scroll';

// Spara scroll-position vid navigering
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;
  
  // Restore position
  const savedPos = sessionStorage.getItem(SCROLL_KEY);
  if (savedPos) {
    container.scrollTop = parseInt(savedPos, 10);
  }
  
  // Save on scroll
  const handleScroll = () => {
    sessionStorage.setItem(SCROLL_KEY, String(container.scrollTop));
  };
  container.addEventListener('scroll', handleScroll);
  return () => container.removeEventListener('scroll', handleScroll);
}, []);
```

Alternativt: Använd `useScrollRestoration` hooken som redan finns i projektet men kräver att AdminLayout exponerar scroll-containern via ref.

---

## Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/lib/utils/commentAuthor.ts` | Lägg till `artistName` parameter |
| `src/components/CommentsSection.tsx` | Hämta och skicka `artist_name` |
| `src/components/CommentItem.tsx` | Hämta och skicka `artist_name` för replies |
| `src/components/video/VideoCommentsSection.tsx` | Hämta och skicka `artist_name` |
| `src/pages/admin/AdminInbox.tsx` | Lägg till scroll-restoration med sessionStorage |

---

## Förväntat resultat

**Efter fix:**
- "Gung Kungen" visas istället för "Johan Kallén" i kommentarer
- Admin Inbox behåller scroll-position när man går tillbaka från en issue-vy
