import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Disc, Loader2 } from "lucide-react";

interface EditAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId: string;
  currentTitle: string;
  currentDescription?: string | null;
  onSuccess: () => void;
}

export function EditAlbumDialog({
  open,
  onOpenChange,
  albumId,
  currentTitle,
  currentDescription,
  onSuccess
}: EditAlbumDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(currentTitle);
    setDescription(currentDescription || "");
  }, [currentTitle, currentDescription]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Album title is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('albums')
        .update({ 
          title: title.trim(),
          description: description.trim() || null 
        })
        .eq('id', albumId);

      if (error) throw error;

      toast.success("Album updated!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update album");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Disc className="h-5 w-5 text-primary" />
            Edit Album Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="album-title">Album Title *</Label>
            <Input
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter album title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="album-description">Description (optional)</Label>
            <Textarea
              id="album-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add album description..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
