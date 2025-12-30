import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { RequestBetaDialog } from "@/components/RequestBetaDialog";

interface PreviewModeBannerProps {
  variant?: 'sticky' | 'inline';
}

export function PreviewModeBanner({ variant = 'sticky' }: PreviewModeBannerProps) {
  const navigate = useNavigate();
  const [showBetaDialog, setShowBetaDialog] = useState(false);

  const baseClasses = "bg-primary/10 border border-primary/20 backdrop-blur-sm";
  const stickyClasses = "fixed top-0 left-0 right-0 z-50 py-3 px-4";
  const inlineClasses = "rounded-lg py-4 px-6 mb-6";

  return (
    <>
      <div className={`${baseClasses} ${variant === 'sticky' ? stickyClasses : inlineClasses}`}>
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Private Beta Preview</span>
              <span className="hidden sm:inline"> — Join the beta for full access to listen, follow, and support artists.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/signin/fan')}
            >
              Sign In
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowBetaDialog(true)}
            >
              Request Access
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
