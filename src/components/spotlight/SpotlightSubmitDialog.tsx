import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Track {
  id: string;
  title: string;
}

interface SpotlightSubmitDialogProps {
  campaignId: string;
  artistId: string;
  onSuccess: () => void;
}

export default function SpotlightSubmitDialog({ campaignId, artistId, onSuccess }: SpotlightSubmitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trackId: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchTracks();
    }
  }, [isOpen, artistId]);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title')
        .eq('artist_id', artistId);

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load your tracks",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.trackId) {
      toast({
        title: "Error",
        description: "Please select a track",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('spotlight_entries')
        .insert([{
          campaign_id: campaignId,
          artist_id: artistId,
          track_id: formData.trackId,
          title: formData.title || null,
          description: formData.description || null,
          status: 'pending',
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Track submitted for review",
      });

      setIsOpen(false);
      setFormData({ trackId: "", title: "", description: "" });
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting entry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit track",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#E8BF1A] to-[#B8960F]">
          <Upload className="mr-2 h-4 w-4" />
          Submit Track
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Submit Track to Spotlight</DialogTitle>
          <DialogDescription>
            Choose a track to submit to this campaign. It will be reviewed by admins before going live.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="track">Select Track *</Label>
            <Select
              value={formData.trackId}
              onValueChange={(value) => setFormData({ ...formData, trackId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((track) => (
                  <SelectItem key={track.id} value={track.id}>
                    {track.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Custom Title (Optional)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Override track title if needed"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell fans about this submission..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}