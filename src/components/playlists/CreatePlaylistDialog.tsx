import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { z } from "zod";

const playlistSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
});

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePlaylistDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreatePlaylistDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const handleCreate = async () => {
    if (!user) {
      toast.error("You must be logged in to create a playlist");
      return;
    }

    try {
      // Validate input
      const result = playlistSchema.safeParse({ name, description });
      if (!result.success) {
        const fieldErrors: { name?: string; description?: string } = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      setLoading(true);

      const { error } = await supabase.from("playlists").insert([{
        user_id: user.id,
        name: result.data.name,
        description: result.data.description || null,
        is_public: isPublic,
      }]);

      if (error) throw error;

      // Track onboarding progress
      await supabase
        .from('fan_onboarding_progress')
        .upsert({
          user_id: user.id,
          has_created_stack: true,
        });

      toast.success("Playlist created successfully!");
      setName("");
      setDescription("");
      setIsPublic(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogDescription>
            Organize your favorite tracks into custom playlists
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Playlist Name *</Label>
            <Input
              id="name"
              placeholder="My Favorite Tracks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your playlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public">Public Playlist</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to view this playlist
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
