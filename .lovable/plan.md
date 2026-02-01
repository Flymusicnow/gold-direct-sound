
# Fix: Musikspelare och Video Thumbnail Upload

## Problem 1: Låten slutar spelas vid omordning

### Nuvarande beteende
När användaren drar en låt till början av kön, slutar den aktuella låten att spelas.

### Orsak
I `FlightdeckQueueDrawer.tsx` rad 174-175 använder koden `item.id === currentItem.id` för att hitta den nya positionen för den spelande låten. Men samma låt kan finnas flera gånger i kön med olika `queueId`. Koden hittar fel instans, vilket gör att spelaren hoppar till en annan position.

### Lösning
Använd `queueId` istället för `id` för att identifiera rätt instans:

```text
Före:
  newQueue.findIndex(item => item.id === currentItem.id)

Efter:
  newQueue.findIndex(item => 
    (item.queueId || item.id) === (currentItem.queueId || currentItem.id)
  )
```

### Fil att ändra
- `src/components/flightdeck/FlightdeckQueueDrawer.tsx` (rad 174-175)

---

## Problem 2: Video Thumbnail Upload

### Nuvarande beteende
Artister kan inte ladda upp custom thumbnails när de laddar upp videos - systemet använder ingen thumbnail.

### Orsak
1. Databasen har redan `thumbnail_url`-kolumn ✓
2. `UploadFile` interface har `thumbnailUrl` men ingen `thumbnailFile` för uppladdning
3. Upload-logiken sparar aldrig thumbnail till storage
4. UI saknar fält för att välja thumbnail

### Lösning

#### Steg 1: Utöka UploadFile interface
Lägg till `thumbnailFile: File | null` i `useMultiUpload.ts`:

```typescript
export interface UploadFile {
  // ... existing fields ...
  thumbnailFile?: File | null;  // NEW: For custom video thumbnail
}
```

#### Steg 2: Uppdatera upload-logiken
I `uploadSingleFile` för videos, lägg till thumbnail-uppladdning före video-insert:

```typescript
// Upload thumbnail if provided
let thumbnailUrl: string | null = null;
if (uploadFile.thumbnailFile) {
  const thumbPath = `${artistId}/thumb_${timestamp}_${sanitizeFileName(uploadFile.thumbnailFile.name)}`;
  const { error: thumbError } = await supabase.storage
    .from('artist_videos')
    .upload(thumbPath, uploadFile.thumbnailFile);
  
  if (!thumbError) {
    const { data: { publicUrl } } = supabase.storage
      .from('artist_videos')
      .getPublicUrl(thumbPath);
    thumbnailUrl = publicUrl;
  }
}

// Include in insert
await supabase.from('artist_video_posts').insert({
  // ... existing fields ...
  thumbnail_url: thumbnailUrl,  // NEW
});
```

#### Steg 3: Lägg till UI i BulkMetadataEditor
Visa thumbnail-uppladdning för video-filer i fil-listan:

```text
+-------------------+------------------+-----------+--------+
| [Checkbox] [📹]  | Title Input      | Visibility| [📷]   |
|                   |                  |           |Thumbnail|
+-------------------+------------------+-----------+--------+
```

### Filer att ändra
1. `src/hooks/useMultiUpload.ts`
   - Lägg till `thumbnailFile` i UploadFile interface
   - Uppdatera `uploadSingleFile` för att hantera thumbnail
   
2. `src/components/artist/BulkMetadataEditor.tsx`
   - Lägg till thumbnail-uppladdningsknapp för videos i fil-raden

---

## Sammanfattning

| Ändring | Fil | Komplexitet |
|---------|-----|-------------|
| Fixa queueId-jämförelse | FlightdeckQueueDrawer.tsx | Låg |
| Lägg till thumbnailFile i interface | useMultiUpload.ts | Låg |
| Uppdatera video upload-logik | useMultiUpload.ts | Medium |
| Lägg till thumbnail UI | BulkMetadataEditor.tsx | Medium |

## Teknisk Specifikation

### FlightdeckQueueDrawer.tsx - Rad 174-175
```typescript
// BEFORE
const newCurrentIndex = currentItem 
  ? newQueue.findIndex(item => item.id === currentItem.id)
  : 0;

// AFTER
const newCurrentIndex = currentItem 
  ? newQueue.findIndex(item => 
      (item.queueId || item.id) === (currentItem.queueId || currentItem.id)
    )
  : 0;
```

### useMultiUpload.ts - Interface
```typescript
export interface UploadFile {
  id: string;
  file: File;
  type: 'song' | 'video';
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  thumbnailFile?: File | null;  // NEW
  title: string;
  visibility: 'draft' | 'public' | 'supporter-only';
  genre?: string;
  mood?: string;
  tags?: string[];
}
```

### useMultiUpload.ts - Upload Logic (rad ~217-250)
```typescript
} else {
  // Upload video
  const videoPath = `${artistId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('artist_videos')
    .upload(videoPath, uploadFile.file);

  if (uploadError) throw uploadError;

  // NEW: Upload thumbnail if provided
  let thumbnailUrl: string | null = null;
  if (uploadFile.thumbnailFile) {
    const thumbName = `thumb_${timestamp}_${sanitizeFileName(uploadFile.thumbnailFile.name)}`;
    const thumbPath = `${artistId}/${thumbName}`;
    const { error: thumbError } = await supabase.storage
      .from('artist_videos')
      .upload(thumbPath, uploadFile.thumbnailFile);
    
    if (!thumbError) {
      const { data: { publicUrl } } = supabase.storage
        .from('artist_videos')
        .getPublicUrl(thumbPath);
      thumbnailUrl = publicUrl;
    }
  }

  setFiles(prev => prev.map(f => 
    f.id === uploadFile.id ? { ...f, progress: 60 } : f
  ));

  // Insert video record with thumbnail
  const { error: insertError } = await supabase.from('artist_video_posts').insert({
    artist_id: artistId,
    video_url: publicUrl,
    caption: uploadFile.title,
    is_supporter_only: uploadFile.visibility === 'supporter-only',
    mood: uploadFile.mood || null,
    tags: uploadFile.tags || null,
    upload_batch_id: uploadBatchId,
    thumbnail_url: thumbnailUrl,  // NEW
  });
  // ...
}
```
