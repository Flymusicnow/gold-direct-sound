
# Video Thumbnail System - Komplett Lösning

## Översikt

Implementera fullständigt thumbnail-stöd för videor i tre delar:
1. Single upload - custom thumbnail val + auto-genererad thumbnail som sparas
2. Befintliga videos - Edit-dialog för att ändra thumbnail
3. Fungerar på desktop och mobil

## Del 1: Single Video Upload Thumbnail

### Ändringar i `StudioVideos.tsx`

**Ny state:**
```typescript
const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
const [thumbnailSource, setThumbnailSource] = useState<'auto' | 'custom'>('auto');
const thumbnailInputRef = useRef<HTMLInputElement>(null);
```

**Uppdaterad thumbnail-sektion i UI (under Preview):**

```text
+---------------------------------------------+
| Thumbnail                                   |
| ○ Auto (from video)   ● Custom              |
+---------------------------------------------+
| [Preview Image]      [Upload Thumbnail]     |
| 16:9 aspect ratio     Remove                |
+---------------------------------------------+
```

- Radio-knappar för val: Auto-genererad vs Custom
- Om Custom: visa upload-knapp + preview
- Om Auto: visa auto-genererad thumbnail + text "Frame at 1 second"

**Uppdaterad `handleUpload` funktion:**
1. Om custom thumbnail: Ladda upp thumbnail till storage först
2. Om auto thumbnail: Konvertera blob till fil och ladda upp
3. Spara `thumbnail_url` i database insert

```typescript
// Upload thumbnail
let thumbnailUrl: string | null = null;
const thumbnailFile = thumbnailSource === 'custom' ? customThumbnailFile : autoThumbnailBlob;
if (thumbnailFile) {
  const thumbPath = `${artistProfile.id}/thumb_${timestamp}.jpg`;
  await supabase.storage.from('artist_videos').upload(thumbPath, thumbnailFile);
  thumbnailUrl = supabase.storage.from('artist_videos').getPublicUrl(thumbPath).data.publicUrl;
}

// Insert with thumbnail_url
await supabase.from('artist_video_posts').insert({
  ...existing_fields,
  thumbnail_url: thumbnailUrl,
});
```

## Del 2: Edit Video Dialog

### Ny komponent: `EditVideoDialog.tsx`

```text
+-------------------------------------------+
|  Edit Video                            X  |
+-------------------------------------------+
|                                           |
|  Current Thumbnail:  [ Video Thumbnail ]  |
|  [Upload New Thumbnail]                   |
|                                           |
|  Caption (optional)                       |
|  +-------------------------------------+  |
|  | Video caption text...               |  |
|  +-------------------------------------+  |
|                                           |
|  Supporter Exclusive        [Toggle]      |
|  Required Tier: [Basic v]                 |
|                                           |
|  [Cancel]               [Save Changes]    |
+-------------------------------------------+
```

**Funktionalitet:**
- Ladda befintlig data
- Visa befintlig thumbnail (om finns)
- Låter upload ny thumbnail
- Uppdatera caption
- Ändra supporter-settings
- DELETE befintlig thumbnail om ny laddas upp (ersätt)

**State och logik:**
```typescript
interface EditVideoDialogProps {
  video: VideoPost;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  artistId: string;
}
```

### Integration i StudioVideos.tsx

**Lägg till Edit-knapp i video-kortet:**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => setEditVideo(video)}
  title="Edit"
>
  <Pencil className="h-4 w-4" />
</Button>
```

**Visa EditVideoDialog:**
```typescript
{editVideo && (
  <EditVideoDialog
    video={editVideo}
    isOpen={!!editVideo}
    onClose={() => setEditVideo(null)}
    onSave={() => { setEditVideo(null); fetchData(); }}
    artistId={artistProfile.id}
  />
)}
```

## Del 3: VideoPost Interface Update

**Utöka VideoPost interface:**
```typescript
interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  view_count: number;
  thumbnail_url: string | null;  // LÄGG TILL
}
```

**Uppdatera fetch-query:**
```typescript
.select("id, video_url, caption, created_at, is_supporter_only, required_tier, view_count, thumbnail_url")
```

## Mobile Responsivitet

### EditVideoDialog
- Använd `Dialog` med `DialogContent className="max-w-lg w-[95vw]"`
- Stapla fält vertikalt på mobil
- Thumbnail-preview i full width på mobil

### Single Upload Thumbnail Section
- Stack radio-knappar och preview vertikalt på mobil
- Touch-vänliga upload-knappar (min 44x44px)

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/components/artist/EditVideoDialog.tsx` | NY - Edit-dialog för befintliga videos |
| `src/pages/studio/StudioVideos.tsx` | ÄNDRA - Lägg till custom thumbnail upload, thumbnail_url i interface, Edit-knapp, integrera EditVideoDialog |

## Teknisk Implementation

### StudioVideos.tsx - Nya imports
```typescript
import { Pencil, ImageIcon } from "lucide-react";
import { EditVideoDialog } from "@/components/artist/EditVideoDialog";
```

### StudioVideos.tsx - Nya states (rad ~65-70)
```typescript
const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
const [autoThumbnailBlob, setAutoThumbnailBlob] = useState<Blob | null>(null);
const [thumbnailSource, setThumbnailSource] = useState<'auto' | 'custom'>('auto');
const thumbnailInputRef = useRef<HTMLInputElement>(null);
const [editVideo, setEditVideo] = useState<VideoPost | null>(null);
```

### StudioVideos.tsx - Uppdaterad VideoPost interface (rad ~41-50)
```typescript
interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  view_count: number;
  thumbnail_url: string | null;
}
```

### StudioVideos.tsx - Uppdaterad generateThumbnail (rad ~189-223)
Ändra så den också sparar blob för upload:
```typescript
const generateThumbnail = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setAutoThumbnailBlob(blob); // Save blob for upload
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
  });
};
```

### EditVideoDialog.tsx - Komplett komponent

```typescript
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, Crown, ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { sanitizeFileName } from "@/lib/utils";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  is_supporter_only: boolean;
  required_tier: string | null;
  thumbnail_url: string | null;
}

interface EditVideoDialogProps {
  video: VideoPost;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  artistId: string;
}

export function EditVideoDialog({ video, isOpen, onClose, onSave, artistId }: EditVideoDialogProps) {
  const [caption, setCaption] = useState(video.caption || "");
  const [isSupporterOnly, setIsSupporterOnly] = useState(video.is_supporter_only);
  const [requiredTier, setRequiredTier] = useState(video.required_tier || "basic");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when video changes
    setCaption(video.caption || "");
    setIsSupporterOnly(video.is_supporter_only);
    setRequiredTier(video.required_tier || "basic");
    setThumbnailPreview(video.thumbnail_url);
    setThumbnailFile(null);
  }, [video]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newThumbnailUrl = video.thumbnail_url;

      // Upload new thumbnail if provided
      if (thumbnailFile) {
        const timestamp = Date.now();
        const thumbPath = `${artistId}/thumb_${timestamp}_${sanitizeFileName(thumbnailFile.name)}`;
        
        const { error: uploadError } = await supabase.storage
          .from('artist_videos')
          .upload(thumbPath, thumbnailFile);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('artist_videos')
          .getPublicUrl(thumbPath);
        
        newThumbnailUrl = publicUrl;

        // Delete old thumbnail if exists
        if (video.thumbnail_url) {
          const oldPath = video.thumbnail_url.split('/artist_videos/')[1];
          if (oldPath) {
            await supabase.storage.from('artist_videos').remove([oldPath]);
          }
        }
      } else if (thumbnailPreview === null && video.thumbnail_url) {
        // User removed thumbnail
        const oldPath = video.thumbnail_url.split('/artist_videos/')[1];
        if (oldPath) {
          await supabase.storage.from('artist_videos').remove([oldPath]);
        }
        newThumbnailUrl = null;
      }

      // Update database record
      const { error: updateError } = await supabase
        .from('artist_video_posts')
        .update({
          caption: caption.trim() || null,
          is_supporter_only: isSupporterOnly,
          required_tier: isSupporterOnly ? requiredTier : null,
          thumbnail_url: newThumbnailUrl,
        })
        .eq('id', video.id);

      if (updateError) throw updateError;

      toast.success("Video updated successfully!");
      onSave();
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error("Failed to update video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Thumbnail Section */}
          <div className="space-y-3">
            <Label>Thumbnail</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Preview */}
              <div className="w-full sm:w-40 aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                {thumbnailPreview ? (
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                </Button>
                {thumbnailPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={handleRemoveThumbnail}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label>Caption (optional)</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption for your video..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {caption.length}/500 characters
            </p>
          </div>

          {/* Supporter Settings */}
          <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Supporter Exclusive
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Restrict this video to supporters only
                </p>
              </div>
              <Switch
                checked={isSupporterOnly}
                onCheckedChange={setIsSupporterOnly}
              />
            </div>
            
            {isSupporterOnly && (
              <div>
                <Label>Required Tier</Label>
                <Select value={requiredTier} onValueChange={setRequiredTier}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Supporter</SelectItem>
                    <SelectItem value="gold">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        Gold Supporter
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Sammanfattning av ändringar

| Uppgift | Fil | Beskrivning |
|---------|-----|-------------|
| Custom thumbnail upload | StudioVideos.tsx | Radio-val auto/custom, upload-knapp, spara till storage/db |
| Auto thumbnail fix | StudioVideos.tsx | Spara blob för upload, inte bara preview URL |
| VideoPost interface | StudioVideos.tsx | Lägg till thumbnail_url |
| Edit-knapp | StudioVideos.tsx | Pencil-ikon på video-kort |
| EditVideoDialog | NY fil | Dialog för att redigera caption, thumbnail, visibility |
| Mobile support | Båda filerna | Responsiv layout, touch-vänliga knappar |
