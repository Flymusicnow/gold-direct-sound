import { Lock, Music, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { RequestBetaDialog } from "@/components/RequestBetaDialog";
import { usePreviewAnalytics } from "@/hooks/usePreviewAnalytics";

interface PreviewGateCTAProps {
  pageName?: string;
}

export function PreviewGateCTA({ pageName = 'artist_profile' }: PreviewGateCTAProps) {
  const navigate = useNavigate();
  const [showBetaDialog, setShowBetaDialog] = useState(false);
  const { trackCTAClick, trackConversionAttempt } = usePreviewAnalytics(pageName);

  const handleRequestAccessClick = () => {
    trackCTAClick('request_access');
    trackConversionAttempt();
    setShowBetaDialog(true);
  };

  const handleSignInClick = () => {
    trackCTAClick('sign_in');
    navigate('/signin/fan');
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8 my-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3">
            Join the Private Beta
          </h3>
          
          <p className="text-muted-foreground mb-6">
            Get full access to listen, follow, and support artists directly.
          </p>
          
          {/* Feature highlights */}
          <div className="flex justify-center gap-6 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <span>Stream music</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span>Follow artists</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span>Join community</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              size="lg"
              onClick={handleRequestAccessClick}
            >
              Request Beta Access
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleSignInClick}
            >
              Already have access? Sign In
            </Button>
          </div>
        </div>
      </div>

      <RequestBetaDialog
        open={showBetaDialog}
        onOpenChange={setShowBetaDialog}
        fixedRole="fan"
      />
    </>
  );
}
