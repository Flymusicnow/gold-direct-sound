import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    caption?: string | null;
  };
  artist: {
    id: string;
    artist_name: string;
  };
}

export function VideoShareModal({ isOpen, onClose, video, artist }: VideoShareModalProps) {
  const { toast } = useToast();
  
  const getShareUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const baseUrl = `${window.location.origin}/artist/${artist.id}`;
    return user ? `${baseUrl}?ref=${user.id}&video=${video.id}` : baseUrl;
  };

  const handleCopyLink = async () => {
    const url = await getShareUrl();
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
    });
  };

  const socialPlatforms = [
    {
      name: "TikTok/Reels",
      caption: `🎥 Check out this video from ${artist.artist_name} on FlyMusic! 🔥\n\n${video.caption || ''}\n\n#FlyMusic #NewVideo`,
      icon: "🎬",
    },
    {
      name: "Instagram Story",
      caption: `New video from ${artist.artist_name}! 🎬 Tap to watch\n\n${video.caption || ''}`,
      icon: "📸",
    },
    {
      name: "Twitter/X",
      caption: `Just watched ${artist.artist_name}'s new video on @FlyMusic! ${video.caption || ''} Check it out:`,
      icon: "🐦",
    },
  ];

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast({
      title: "Caption copied!",
      description: "Share caption has been copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Artist</p>
            <p className="text-lg text-primary">{artist.artist_name}</p>
          </div>

          {video.caption && (
            <div>
              <p className="text-sm font-medium mb-2">Caption</p>
              <p className="text-sm text-muted-foreground">{video.caption}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-3">Share Link</p>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full gap-2 border-primary/20 hover:border-primary/50"
            >
              <Copy className="w-4 h-4" />
              Copy Video Link
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Pre-filled Captions</p>
            <div className="space-y-2">
              {socialPlatforms.map((platform) => (
                <div
                  key={platform.name}
                  className="p-3 rounded-lg border border-border bg-card/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span>{platform.icon}</span>
                      {platform.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyCaption(platform.caption)}
                      className="h-8"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {platform.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Share links include referral tracking to credit you for spreading the word! 🎵
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
