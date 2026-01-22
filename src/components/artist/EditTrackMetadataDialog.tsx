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
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, X, Tag, Music, Sparkles } from "lucide-react";

const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Rock", "Electronic", "Jazz", "Classical",
  "Country", "Folk", "Indie", "Metal", "Reggae", "Soul", "Blues", "Other"
];

const MOODS = [
  "Energetic", "Chill", "Happy", "Sad", "Romantic", "Aggressive",
  "Peaceful", "Motivational", "Dark", "Uplifting", "Melancholic", "Party"
];

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
  const [tagsInput, setTagsInput] = useState((currentTrack.tags || []).join(", "));
  const [visibility, setVisibility] = useState(currentTrack.visibility || "public");
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
      // Parse tags from comma-separated string
      const tags = tagsInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error } = await supabase
        .from("tracks")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          genre: genre || null,
          mood: mood || null,
          tags: tags.length > 0 ? tags : null,
          visibility: visibility,
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

  const addTag = (tag: string) => {
    const currentTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      setTagsInput([...currentTags, tag].join(", "));
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    setTagsInput(currentTags.filter(t => t !== tagToRemove).join(", "));
  };

  const parsedTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

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

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="edit-genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="edit-genre">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label htmlFor="edit-mood">Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger id="edit-mood">
                <SelectValue placeholder="Select a mood" />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            
            {/* Current Tags */}
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {parsedTags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="text-sm"
            />

            {/* Quick Add Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {["New Release", "Featured", "Remix", "Original", "Live", "Acoustic"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>

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
