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
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Thumbnail Section */}
          <div className="space-y-3">
            <Label>Thumbnail</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Preview */}
              <div className="w-full sm:w-40 aspect-video bg-muted rounded-lg overflow-hidden border border-border flex-shrink-0">
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
                  className="min-h-[44px]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                </Button>
                {thumbnailPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-[44px]"
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
