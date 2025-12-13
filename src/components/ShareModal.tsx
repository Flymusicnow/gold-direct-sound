import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, Instagram, Music2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSupportScore } from "@/hooks/useSupportScore";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
  shareUrl: string;
  artistId?: string;
}

export const ShareModal = ({ isOpen, onClose, artistName, shareUrl, artistId }: ShareModalProps) => {
  const { user } = useAuth();
  const { updateSupportScore } = useSupportScore();
  
  const shareUrlWithRef = user ? `${shareUrl}?ref=${user.id}` : shareUrl;
  const encodedUrl = encodeURIComponent(shareUrlWithRef);
  const encodedText = encodeURIComponent(`Check out ${artistName} on FlyMusic!`);

  const handleCopyLink = async () => {
    navigator.clipboard.writeText(shareUrlWithRef);
    toast.success("Link copied to clipboard!");
    
    // Update support score
    if (artistId) {
      updateSupportScore(artistId, 'share');
    }
    
    // Update onboarding progress
    if (user) {
      await supabase
        .from("artist_onboarding_progress")
        .update({ has_shared_profile: true })
        .eq("user_id", user.id);
    }
  };

  const socialLinks = [
    {
      name: "Copy Link",
      icon: Link,
      onClick: handleCopyLink,
      className: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: `https://www.instagram.com/`,
      className: "bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white",
    },
    {
      name: "TikTok",
      icon: Music2,
      href: `https://www.tiktok.com/`,
      className: "bg-black hover:bg-gray-900 text-white",
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Share Artist</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {socialLinks.map((social) => (
            <Button
              key={social.name}
              onClick={social.onClick}
              asChild={!!social.href}
              className={`w-full justify-start gap-3 ${social.className}`}
              size="lg"
            >
              {social.href ? (
                <a href={social.href} target="_blank" rel="noopener noreferrer">
                  <social.icon className="w-5 h-5" />
                  <span className="font-medium">{social.name}</span>
                </a>
              ) : (
                <>
                  <social.icon className="w-5 h-5" />
                  <span className="font-medium">{social.name}</span>
                </>
              )}
            </Button>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Share this artist with your friends and help them grow!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
