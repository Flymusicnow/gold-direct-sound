import { useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpotlightMedia } from "@/hooks/useArtistSpotlight";
import { useCreateABTest } from "@/hooks/useABTests";
import { cn } from "@/lib/utils";

interface ABTestCreatorProps {
  artistId: string;
  spotlightMedia: SpotlightMedia[];
}

export function ABTestCreator({ artistId, spotlightMedia }: ABTestCreatorProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [variantA, setVariantA] = useState<string>('');
  const [variantB, setVariantB] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number | null>(7);
  
  const createTest = useCreateABTest();

  const handleCreate = async () => {
    if (!name.trim() || !variantA || !variantB) return;

    const endDate = durationDays 
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : undefined;

    await createTest.mutateAsync({
      artistId,
      name: name.trim(),
      variantAMediaId: variantA,
      variantBMediaId: variantB,
      endDate,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setVariantA('');
    setVariantB('');
    setDurationDays(7);
  };

  const activeMedia = spotlightMedia.filter(m => m.is_active && m.publish_status === 'published');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FlaskConical className="h-4 w-4" />
          Create A/B Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>
            Test two spotlight variants to see which performs better with fans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Test Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Release Styles"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Variant A */}
            <div className="space-y-2">
              <Label>Variant A</Label>
              <Select value={variantA} onValueChange={setVariantA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select media" />
                </SelectTrigger>
                <SelectContent>
                  {activeMedia
                    .filter(m => m.id !== variantB)
                    .map((media) => (
                      <SelectItem key={media.id} value={media.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-12 rounded overflow-hidden bg-muted">
                            {media.media_type === 'video' ? (
                              <video src={media.media_url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={media.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-xs">#{media.display_order}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {variantA && (
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted max-h-32">
                  {activeMedia.find(m => m.id === variantA)?.media_type === 'video' ? (
                    <video 
                      src={activeMedia.find(m => m.id === variantA)?.media_url} 
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img 
                      src={activeMedia.find(m => m.id === variantA)?.media_url} 
                      alt="Variant A"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Variant B */}
            <div className="space-y-2">
              <Label>Variant B</Label>
              <Select value={variantB} onValueChange={setVariantB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select media" />
                </SelectTrigger>
                <SelectContent>
                  {activeMedia
                    .filter(m => m.id !== variantA)
                    .map((media) => (
                      <SelectItem key={media.id} value={media.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-12 rounded overflow-hidden bg-muted">
                            {media.media_type === 'video' ? (
                              <video src={media.media_url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={media.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-xs">#{media.display_order}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {variantB && (
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted max-h-32">
                  {activeMedia.find(m => m.id === variantB)?.media_type === 'video' ? (
                    <video 
                      src={activeMedia.find(m => m.id === variantB)?.media_url} 
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img 
                      src={activeMedia.find(m => m.id === variantB)?.media_url} 
                      alt="Variant B"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Test Duration (optional)</Label>
            <Select 
              value={durationDays?.toString() || 'none'} 
              onValueChange={(v) => setDurationDays(v === 'none' ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No end date (manual)</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!name.trim() || !variantA || !variantB || createTest.isPending}
          >
            {createTest.isPending ? 'Creating...' : 'Start Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
