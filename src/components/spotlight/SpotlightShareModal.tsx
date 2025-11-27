import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SpotlightShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: {
    id: string;
    title: string;
    artistName: string;
    campaignName: string;
    rank?: number;
    votes: number;
  };
  campaignId: string;
}

export default function SpotlightShareModal({
  isOpen,
  onClose,
  entry,
  campaignId,
}: SpotlightShareModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/spotlight/${campaignId}${user ? `?ref=${user.id}` : ""}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share it with your friends",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const captions = {
    tiktok: `🎵 Vote for ${entry.artistName} in #FlyMusicSpotlight! Link in bio 🔥`,
    instagram: `Support ${entry.artistName} in FlyMusic Spotlight! Tap to vote 🌟`,
    twitter: `Just voted for ${entry.artistName} in @FlyMusic Spotlight! 🎶 Check them out: ${shareUrl}`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#E8BF1A]" />
            Share Spotlight Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entry Preview */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-lg">{entry.title}</p>
            <p className="text-sm text-muted-foreground">{entry.artistName}</p>
            <p className="text-xs text-muted-foreground mt-2">{entry.campaignName}</p>
            {entry.rank && (
              <p className="text-sm text-[#E8BF1A] mt-1">Currently #{entry.rank}</p>
            )}
            <p className="text-sm text-muted-foreground">{entry.votes} votes</p>
          </div>

          {/* Copy Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
              />
              <Button onClick={handleCopyLink} size="icon" variant="outline">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Pre-filled Captions */}
          <div className="space-y-3">
            <label className="text-sm font-medium block">Caption Ideas</label>
            
            <div className="space-y-2">
              <div className="p-3 rounded-md bg-muted/30 border">
                <p className="text-xs font-medium text-[#E8BF1A] mb-1">TikTok / Reels</p>
                <p className="text-sm">{captions.tiktok}</p>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border">
                <p className="text-xs font-medium text-[#E8BF1A] mb-1">Instagram Story</p>
                <p className="text-sm">{captions.instagram}</p>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border">
                <p className="text-xs font-medium text-[#E8BF1A] mb-1">Twitter / X</p>
                <p className="text-sm">{captions.twitter}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
