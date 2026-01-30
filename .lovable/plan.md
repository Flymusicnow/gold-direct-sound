

# Plan: Emoji-picker + Redigering i Spotlight-kommentarer

## Funktioner att lägga till

1. **Emoji-picker** - Klickbar smiley-ikon bredvid inputfältet
2. **Redigera egen kommentar** - Inline-redigering för den som skrev kommentaren

## Design

```text
┌─────────────────────────────────────────────────────────┐
│  👤 INFINITE · 1m                              [✏️][🗑️] │
│  This is Soooow Sooooft and yet a banger wooowww        │
└─────────────────────────────────────────────────────────┘

Redigeringsläge:
┌─────────────────────────────────────────────────────────┐
│  👤 INFINITE · 1m                                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ This is Soooow Sooooft and yet a...              │   │
│  └──────────────────────────────────────────────────┘   │
│  [😊] [Avbryt] [Spara]                                  │
└─────────────────────────────────────────────────────────┘

Inputfältet (med emoji):
┌─────────────────────────────────────────────────────────┐
│  [Skriv en kommentar...               ] [😊] [➤]       │
└─────────────────────────────────────────────────────────┘
```

## Ändringar

### Fil: `src/components/spotlight/SpotlightEntryComments.tsx`

**1. Lägg till emoji-picker för ny kommentar**

```tsx
import { EmojiPicker } from '@/components/ui/emoji-picker';

// I input-sektionen:
<form className="flex gap-2 items-center">
  <Input value={newComment} ... />
  <EmojiPicker onEmojiSelect={(emoji) => setNewComment(prev => prev + emoji)} />
  <Button type="submit">...</Button>
</form>
```

**2. Lägg till redigeringsfunktion**

Nya state-variabler:
```tsx
const [editingId, setEditingId] = useState<string | null>(null);
const [editContent, setEditContent] = useState('');
```

Ny funktion för att uppdatera kommentar:
```tsx
const handleUpdate = async () => {
  if (!editContent.trim() || !editingId) return;
  
  await supabase
    .from('spotlight_entry_comments')
    .update({ content: editContent.trim() })
    .eq('id', editingId)
    .eq('user_id', user.id);  // RLS säkerställer ägarskap
  
  setEditingId(null);
  setEditContent('');
  fetchComments();
};
```

**3. Lägg till ikoner för edit/delete i kommentarslistan**

```tsx
// För varje kommentar där user_id === current user:
{comment.user_id === user?.id && (
  <div className="flex gap-1">
    <Button size="icon" variant="ghost" onClick={() => startEdit(comment)}>
      <Pencil className="h-3 w-3" />
    </Button>
    <Button size="icon" variant="ghost" onClick={() => handleDelete(comment.id)}>
      <Trash2 className="h-3 w-3" />
    </Button>
  </div>
)}

// Vid redigering, visa inline-editor istället för texten:
{editingId === comment.id ? (
  <div className="flex flex-col gap-2">
    <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} />
    <div className="flex gap-2 items-center">
      <EmojiPicker onEmojiSelect={(emoji) => setEditContent(prev => prev + emoji)} />
      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Avbryt</Button>
      <Button size="sm" onClick={handleUpdate}>Spara</Button>
    </div>
  </div>
) : (
  <p>{comment.content}</p>
)}
```

**4. Delete-funktion (soft delete)**

```tsx
const handleDelete = async (commentId: string) => {
  await supabase
    .from('spotlight_entry_comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('user_id', user.id);
  
  fetchComments();
};
```

## UX-detaljer

- Emoji-knappen visas som en liten smiley-ikon (😊) vid inputfältet
- Redigera/ta bort ikoner visas diskret endast på användarens egna kommentarer
- Redigering sker inline - ingen modal eller popup
- Emoji-picker används även i redigeringsläget

## Sammanfattning

| Funktion | Beskrivning |
|----------|-------------|
| Emoji-picker | Infoga emojis i nya och redigerade kommentarer |
| Redigera | Klicka på pennikon för att redigera din kommentar |
| Ta bort | Soft-delete med papperskorg-ikon |

