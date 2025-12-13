import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeFileName } from "@/lib/utils";
import { toast } from "sonner";
import { Camera, Loader2, Disc } from "lucide-react";

interface EditAlbumCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  trackIds: string[];
  currentCoverUrl: string | null;
  onSuccess: () => void;
}

export function EditAlbumCoverDialog({
  open,
  onOpenChange,
  batchId,
  trackIds,
  currentCoverUrl,
  onSuccess
}: EditAlbumCoverDialogProps) {
  const { user } = useAuth();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentCoverUrl);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleApplyToAll = async () => {
    if (!coverFile || !user) return;

    setUploading(true);
    try {
      // Upload the cover image
      const coverPath = `${user.id}/${Date.now()}_${sanitizeFileName(coverFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(coverPath, coverFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(coverPath);

      // Update ALL tracks in the batch
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ cover_url: publicUrl })
        .in('id', trackIds);

      if (updateError) throw updateError;

      toast.success(`Cover applied to all ${trackIds.length} tracks!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update covers");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setCoverFile(null);
    setPreview(currentCoverUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Disc className="h-5 w-5 text-primary" />
            Edit Album Cover
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="aspect-square w-full max-w-[200px] mx-auto rounded-lg bg-muted overflow-hidden">
            {preview ? (
              <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* File input */}
          <div>
            <Label htmlFor="album-cover-file">Choose new album cover</Label>
            <Input
              id="album-cover-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>

          {/* Info text */}
          <p className="text-sm text-muted-foreground text-center">
            This will apply the cover to all {trackIds.length} tracks in this album.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleApplyToAll} disabled={!coverFile || uploading} className="w-full">
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Camera className="h-4 w-4 mr-2" />
              Apply to All {trackIds.length} Tracks
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
