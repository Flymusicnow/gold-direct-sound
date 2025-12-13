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
import { Camera, Loader2 } from "lucide-react";

interface EditTrackCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentCoverUrl: string | null;
  onSuccess: () => void;
}

export function EditTrackCoverDialog({
  open,
  onOpenChange,
  trackId,
  currentCoverUrl,
  onSuccess
}: EditTrackCoverDialogProps) {
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

  const handleSave = async () => {
    if (!coverFile || !user) return;

    setUploading(true);
    try {
      const coverPath = `${user.id}/${Date.now()}_${sanitizeFileName(coverFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(coverPath, coverFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(coverPath);

      const { error: updateError } = await supabase
        .from('tracks')
        .update({ cover_url: publicUrl })
        .eq('id', trackId);

      if (updateError) throw updateError;

      toast.success("Cover updated!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update cover");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Edit Track Cover
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="aspect-square w-full max-w-[200px] mx-auto rounded-lg bg-muted overflow-hidden">
            {preview ? (
              <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* File input */}
          <div>
            <Label htmlFor="cover-file">Choose new cover image</Label>
            <Input
              id="cover-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!coverFile || uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Cover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
