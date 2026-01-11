import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditStreamDialogProps {
  stream: {
    id: string;
    title: string;
    description?: string;
    scheduled_start?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditStreamDialog({
  stream,
  open,
  onOpenChange,
  onSuccess,
}: EditStreamDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");

  // Sync form with stream data when opened
  useEffect(() => {
    if (stream && open) {
      setTitle(stream.title);
      setDescription(stream.description || "");
      if (stream.scheduled_start) {
        // Format for datetime-local input
        const date = new Date(stream.scheduled_start);
        setScheduledStart(date.toISOString().slice(0, 16));
      } else {
        setScheduledStart("");
      }
    }
  }, [stream, open]);

  const handleSave = async () => {
    if (!stream) return;
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const updates: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (scheduledStart) {
        updates.scheduled_start = new Date(scheduledStart).toISOString();
      }

      const { error } = await supabase
        .from("artist_live_streams")
        .update(updates)
        .eq("id", stream.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stream updated successfully",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Stream</DialogTitle>
          <DialogDescription>
            Update your stream details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stream title"
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this stream about?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-scheduled">Scheduled Start (optional)</Label>
            <Input
              id="edit-scheduled"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="min-h-[44px]"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
