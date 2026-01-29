import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Lock, Crown, Music, Sparkles } from "lucide-react";
import { TrackMetadataFields } from "./TrackMetadataFields";

interface EditTrackMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentTrack: {
    title: string;
    description: string | null;
    genre: string | null;
    mood: string | null;
    tags: string[] | null;
    visibility: string | null;
    is_supporter_only: boolean;
    required_tier: string | null;
  };
  onSuccess: () => void;
}

export function EditTrackMetadataDialog({
  open,
  onOpenChange,
  trackId,
  currentTrack,
  onSuccess
}: EditTrackMetadataDialogProps) {
  const [title, setTitle] = useState(currentTrack.title);
  const [description, setDescription] = useState(currentTrack.description || "");
  const [genre, setGenre] = useState(currentTrack.genre || "");
  const [mood, setMood] = useState(currentTrack.mood || "");
  const [tags, setTags] = useState<string[]>(currentTrack.tags || []);
  const [isSupporterOnly, setIsSupporterOnly] = useState(currentTrack.is_supporter_only);
  const [requiredTier, setRequiredTier] = useState(currentTrack.required_tier || "basic");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Track title is required");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("tracks")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          genre: genre || null,
          mood: mood || null,
          tags: tags.length > 0 ? tags : null,
          is_supporter_only: isSupporterOnly,
          required_tier: isSupporterOnly ? requiredTier : null,
        })
        .eq("id", trackId);

      if (error) throw error;

      toast.success("Track updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update track");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Edit Track Metadata
          </DialogTitle>
          <DialogDescription>
            Update your track's information, tags, and visibility settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Track Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell listeners about this track..."
              rows={3}
            />
          </div>

          {/* Genre, Mood & Tags */}
          <TrackMetadataFields
            genre={genre}
            onGenreChange={setGenre}
            mood={mood}
            onMoodChange={setMood}
            tags={tags}
            onTagsChange={setTags}
          />

          {/* Supporter Exclusive Settings */}
          <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-supporter-only" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Supporter Exclusive
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Restrict this track to supporters only
                </p>
              </div>
              <Switch
                id="edit-supporter-only"
                checked={isSupporterOnly}
                onCheckedChange={setIsSupporterOnly}
              />
            </div>
            
            {isSupporterOnly && (
              <div className="space-y-2">
                <Label htmlFor="edit-required-tier">Required Tier</Label>
                <Select value={requiredTier} onValueChange={setRequiredTier}>
                  <SelectTrigger id="edit-required-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Supporter (49 kr/mo)</SelectItem>
                    <SelectItem value="gold">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        Gold Supporter (99 kr/mo)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Sparkles className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
