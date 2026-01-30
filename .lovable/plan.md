
# Bugfix-plan: Spotlight-kommentarer, Emoji, Likes & Navigation

## Sammanfattning av buggar

| Bugg | Orsak | Prioritet |
|------|-------|-----------|
| 1. Emoji-knapp saknas | `CommentComposer.tsx` saknar `EmojiPicker` | Hög |
| 2. Kan inte likea community-kommentarer | Ingen tabell `post_comment_likes` finns | Hög |
| 3. Navigation visar fel namn | `FanPublicProfile` har ingen tillbaka-destination-logik | Medium |
| 4. Spotlight kommentarer (feature request) | YourVotesCard har ingen kommentar-funktionalitet | Medium |

---

## Bugg 1: Emoji-knapp saknas i Community CommentComposer

### Problemanalys
**Fil:** `src/components/community/CommentComposer.tsx`

Jämförelse:
- **CommentItem.tsx** (Artist profile): ✅ Har `<EmojiPicker onEmojiSelect={...} />`
- **VideoCommentsSection.tsx**: ✅ Har `<EmojiPicker />`
- **CommentComposer.tsx** (Community): ❌ Saknar EmojiPicker helt

### Lösning
Lägg till EmojiPicker i CommentComposer.tsx:

```typescript
import { EmojiPicker } from '@/components/ui/emoji-picker';

// I JSX, vid Textarea
<div className="flex gap-2">
  <div className="flex-1 space-y-1">
    <Textarea ... />
    <div className="flex items-center gap-2">
      <EmojiPicker onEmojiSelect={(emoji) => setContent(prev => prev + emoji)} />
      <span className="text-xs text-muted-foreground">{content.length}/1000</span>
    </div>
  </div>
  <Button onClick={handleSubmit} ...>
    <Send />
  </Button>
</div>
```

---

## Bugg 2: Kan inte likea community-kommentarer

### Problemanalys
Databastabeller för kommentars-likes:
- `comment_likes` → för `comments` (artist profile)
- `video_comment_likes` → för `video_comments`
- **❌ Ingen tabell för `post_comments` (community)**

`CommentThread.tsx` och `InlineComments.tsx` har ingen like-funktionalitet.

### Lösning

**Steg 1: Skapa databastabell**
```sql
CREATE TABLE IF NOT EXISTS post_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Index
CREATE INDEX idx_post_comment_likes_comment ON post_comment_likes(comment_id);
CREATE INDEX idx_post_comment_likes_user ON post_comment_likes(user_id);

-- RLS
ALTER TABLE post_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all likes"
  ON post_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON post_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own"
  ON post_comment_likes FOR DELETE
  USING (auth.uid() = user_id);
```

**Steg 2: Uppdatera CommentThread.tsx**
Lägg till like-funktionalitet i `CommentItem`:

```typescript
// Hämta likes
const [likes, setLikes] = useState<string[]>([]);
const [hasLiked, setHasLiked] = useState(false);

// Like toggle
const handleLike = async () => {
  if (hasLiked) {
    await supabase.from('post_comment_likes').delete()
      .eq('comment_id', comment.id)
      .eq('user_id', userId);
  } else {
    await supabase.from('post_comment_likes').insert({
      comment_id: comment.id,
      user_id: userId
    });
  }
};
```

**Steg 3: Uppdatera InlineComments.tsx**
Visa like-count och heart-ikon för varje kommentar.

---

## Bugg 3: Navigation visar fel artistnamn & dålig tillbaka-logik

### Problemanalys
Från skärmdumpen:
1. Användaren klickar på "Anonymous" (som visar Bronze-badge)
2. Navigeras till `/fan/profile/{userId}`
3. "Back"-knappen går fel (`navigate(-1)` kan leda till oväntad sida)
4. I CommentItem.tsx visas "Artist" som fallback istället för riktigt namn

**Rotorsak:**
- `useAuthorIdentity` returnerar `displayName: 'Fan'` om inget namn finns
- Men i äldre komponenter kan "Artist" eller "Anonymous" fortfarande visas
- `navigate(-1)` är opålitlig om historiken är kort

### Lösning

**För CommentThread.tsx** - Förbättra profilklick:
```typescript
const handleProfileClick = (authorId: string, identity: AuthorIdentity | undefined) => {
  if (identity?.artistProfileId) {
    navigate(`/artist/${identity.artistProfileId}`);
  } else {
    // Navigera till fan-profil om det finns ett riktigt namn
    if (identity && identity.displayName !== 'Fan' && identity.displayName !== 'Unknown User') {
      navigate(`/fan/profile/${authorId}`);
    }
    // Annars: gör inget (anonymous ska inte vara klickbar)
  }
};
```

**För FanPublicProfile.tsx** - Säkrare back-navigation:
```typescript
const handleBack = () => {
  // Om historiken är kort, gå till förinställd sida
  if (window.history.length <= 2) {
    navigate('/');
  } else {
    navigate(-1);
  }
};
```

---

## Bugg 4: Spotlight - Kommentarer på röstade tracks (Feature Request)

### Nuläge
`YourVotesCard.tsx` visar endast track-info, votes och rank-ändringar.

### Förslag: Minimal Implementation (Wave 1)
Lägg till en kommentarikon som öppnar en sheet/modal med enkel kommentar för entry:

**Databasschema:**
```sql
CREATE TABLE spotlight_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES spotlight_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**OBS:** Detta är en feature request, inte en bugg. Kan implementeras i nästa iteration.

---

## Filöversikt

| Fil | Ändring | Prioritet |
|-----|---------|-----------|
| `supabase/migrations/xxx_post_comment_likes.sql` | Skapa tabell + RLS | Hög |
| `src/components/community/CommentComposer.tsx` | Lägg till EmojiPicker | Hög |
| `src/components/community/CommentThread.tsx` | Lägg till like-funktionalitet | Hög |
| `src/components/community/InlineComments.tsx` | Visa likes, lägg till heart-ikon | Medium |
| `src/pages/fan/FanPublicProfile.tsx` | Säkrare back-navigation | Medium |
| `src/hooks/usePostCommentLikes.ts` | **NY** - Hook för post comment likes | Hög |

---

## Definition of Done

- [ ] EmojiPicker visas i Community CommentComposer
- [ ] `post_comment_likes` tabell finns med korrekta RLS-policies
- [ ] Användare kan likea/unlikea community-kommentarer
- [ ] Heart-ikon med like-count visas på varje kommentar
- [ ] Anonymous-användare är inte klickbara
- [ ] Back-knappen navigerar korrekt i FanPublicProfile
- [ ] Spotlight-kommentarer dokumenteras som framtida feature

---

## Teknisk sekvens

```text
1. Databasmigration: post_comment_likes
           │
           ▼
2. usePostCommentLikes hook
           │
           ▼
3. CommentComposer + EmojiPicker
           │
           ▼
4. CommentThread + like-funktionalitet
           │
           ▼
5. InlineComments + like-visning
           │
           ▼
6. FanPublicProfile navigation fix
```
