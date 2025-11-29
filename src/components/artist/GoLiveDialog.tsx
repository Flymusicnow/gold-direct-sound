import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoLiveDialogProps {
  artistId: string;
  onSuccess?: () => void;
}

export function GoLiveDialog({ artistId, onSuccess }: GoLiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stream_url: "",
    thumbnail_url: "",
    scheduled_start: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("artist_live_streams").insert({
        artist_id: artistId,
        title: formData.title,
        description: formData.description || null,
        stream_url: formData.stream_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        scheduled_start: formData.scheduled_start || null,
        status: "scheduled",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live stream scheduled successfully",
      });

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        stream_url: "",
        thumbnail_url: "",
        scheduled_start: "",
      });
      onSuccess?.();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-500 hover:bg-red-600 text-white">
          <Radio className="h-4 w-4 mr-2" />
          Schedule Stream
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Live Stream</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Stream Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Live Performance, Q&A Session, etc."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will you be streaming?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="stream_url">Stream URL</Label>
            <Input
              id="stream_url"
              type="url"
              value={formData.stream_url}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              placeholder="YouTube Live, Twitch, or custom RTMP URL"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your YouTube Live, Twitch, or custom stream URL. You can add this later.
            </p>
          </div>

          <div>
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="scheduled_start">Scheduled Start Time</Label>
            <Input
              id="scheduled_start"
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-red-500 hover:bg-red-600">
              {isLoading ? "Scheduling..." : "Schedule Stream"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
