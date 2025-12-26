import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, MessageCircle, UserPlus, Star } from "lucide-react";

type LoginPromptAction = 'vote' | 'follow' | 'comment' | 'support' | 'save';

interface LoginPromptOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: LoginPromptAction;
  redirectPath?: string;
}

const actionConfig: Record<LoginPromptAction, { icon: React.ElementType; titleKey: string; descriptionKey: string }> = {
  vote: {
    icon: Heart,
    titleKey: 'loginPrompt.voteTitle',
    descriptionKey: 'loginPrompt.voteDescription',
  },
  follow: {
    icon: UserPlus,
    titleKey: 'loginPrompt.followTitle',
    descriptionKey: 'loginPrompt.followDescription',
  },
  comment: {
    icon: MessageCircle,
    titleKey: 'loginPrompt.commentTitle',
    descriptionKey: 'loginPrompt.commentDescription',
  },
  support: {
    icon: Star,
    titleKey: 'loginPrompt.supportTitle',
    descriptionKey: 'loginPrompt.supportDescription',
  },
  save: {
    icon: Heart,
    titleKey: 'loginPrompt.saveTitle',
    descriptionKey: 'loginPrompt.saveDescription',
  },
};

export function LoginPromptOverlay({ 
  open, 
  onOpenChange, 
  action, 
  redirectPath 
}: LoginPromptOverlayProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const config = actionConfig[action];
  const Icon = config.icon;

  const handleCreateAccount = () => {
    const redirect = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : '';
    navigate(`/auth${redirect}`);
    onOpenChange(false);
  };

  const handleSignIn = () => {
    const redirect = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}&mode=signin` : '?mode=signin';
    navigate(`/auth${redirect}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t(config.titleKey)}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(config.descriptionKey)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-col gap-3 mt-4">
          <Button onClick={handleCreateAccount} className="w-full bg-gradient-gold">
            {t('loginPrompt.createAccount')}
          </Button>
          <Button variant="outline" onClick={handleSignIn} className="w-full">
            {t('loginPrompt.signIn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
