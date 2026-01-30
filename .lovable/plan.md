
# Plan: Fixa textinmatning, borttagning och bekräftelse

## Sammanfattning

Jag har undersökt koden och funnit:
- **RLS-policyn är korrekt** - UPDATE tillåts för `auth.uid() = user_id`
- **Input-komponenten** stödjer inte text wrapping - behöver bytas till Textarea
- **Bekräftelsedialog** saknas för radering
- **Mobil-knappar** visas endast på hover (fungerar ej på touch)

## Ändringar i `SpotlightEntryComments.tsx`

### 1. Byt Input till Textarea med auto-resize

```tsx
// Ny funktion för auto-resize
const handleTextareaChange = (e, setter) => {
  setter(e.target.value);
  e.target.style.height = 'auto';
  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
};

// Ersätt Input med Textarea
<Textarea
  value={newComment}
  onChange={(e) => handleTextareaChange(e, setNewComment)}
  className="min-h-[40px] max-h-[120px] resize-none"
  rows={1}
/>
```

### 2. Lägg till bekräftelsedialog för radering

```tsx
// Nytt state
const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

// AlertDialog-komponenten
<AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Ta bort kommentar?</AlertDialogTitle>
      <AlertDialogDescription>
        Denna åtgärd kan inte ångras.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Avbryt</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Ta bort</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Mobil-anpassade knappar

```tsx
// Ändra från: opacity-0 group-hover:opacity-100
// Till: sm:opacity-0 sm:group-hover:opacity-100 (alltid synlig på mobil)
<div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100">
  <Button className="h-6 w-6 sm:h-5 sm:w-5">...</Button>
</div>
```

### 4. Uppdatera handleDelete

```tsx
const handleDelete = async () => {
  if (!user || !deleteCommentId) return;
  
  await supabase
    .from('spotlight_entry_comments')
    .update({ is_deleted: true })
    .eq('id', deleteCommentId)
    .eq('user_id', user.id);
  
  fetchComments();
  setDeleteCommentId(null);
};
```

## Tekniska detaljer

| Komponent | Ändring |
|-----------|---------|
| `Textarea` | Ersätter `Input` för text wrapping |
| `AlertDialog` | Bekräftelse innan radering |
| CSS-klasser | `sm:opacity-0` för mobil-synlighet |
| State | Nytt `deleteCommentId` för dialog-kontroll |

## Fil som ändras

- `src/components/spotlight/SpotlightEntryComments.tsx`

Ingen databasändring behövs - RLS-policyn är redan korrekt konfigurerad.
