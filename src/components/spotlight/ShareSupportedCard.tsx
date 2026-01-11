import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Share2, Check, ExternalLink } from "lucide-react";
import { VotedEntry } from "@/contexts/SpotlightVoteContext";
import { ShareableVotesImage } from "./ShareableVotesImage";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface ShareSupportedCardProps {
  isOpen: boolean;
  onClose: () => void;
  votedEntries: VotedEntry[];
  fanName: string;
  fanAvatar: string | null;
  fanId: string;
}

export function ShareSupportedCard({
  isOpen,
  onClose,
  votedEntries,
  fanName,
  fanAvatar,
  fanId,
}: ShareSupportedCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      });
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) {
      toast({
        title: "Couldn't generate image",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flymusic-spotlight-${fanName.toLowerCase().replace(/\s/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Image downloaded!",
      description: "Share it on your socials",
    });
  };

  const handleCopyToClipboard = async () => {
    const blob = await generateImage();
    if (!blob) {
      toast({
        title: "Couldn't generate image",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard!",
        description: "Paste it anywhere",
      });
    } catch (error) {
      // Fallback: download instead
      handleDownload();
    }
  };

  const handleNativeShare = async () => {
    const blob = await generateImage();
    if (!blob) {
      toast({
        title: "Couldn't generate image",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], "spotlight-picks.png", {
          type: "image/png",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "My Spotlight Picks on FlyMusic",
            text: "Check out the artists I'm supporting on FlyMusic Spotlight!",
            files: [file],
          });
          return;
        }
      } catch (error) {
        // Fall through to download
      }
    }

    // Fallback to download
    handleDownload();
  };

  const shareUrl = `${window.location.origin}/fan/${fanId}/votes`;

  const handleShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share your voting history",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Spotlight Picks</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <div className="overflow-hidden rounded-lg border border-border">
            <ShareableVotesImage
              ref={cardRef}
              votedEntries={votedEntries}
              fanName={fanName}
              fanAvatar={fanAvatar}
              fanId={fanId}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="min-h-[44px]"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            <Button
              onClick={handleCopyToClipboard}
              disabled={isGenerating}
              variant="outline"
              className="min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Native Share (mobile) */}
          {"share" in navigator && (
            <Button
              onClick={handleNativeShare}
              disabled={isGenerating}
              variant="outline"
              className="w-full min-h-[44px]"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}

          {/* Share Link */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded-md text-muted-foreground"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareLink}
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
