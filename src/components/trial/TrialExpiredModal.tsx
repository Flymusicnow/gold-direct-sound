import { useNavigate } from 'react-router-dom';
import { Clock, Mail, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrialStatus } from '@/hooks/useTrialStatus';

interface TrialExpiredModalProps {
  /**
   * Optional callback when user takes an action.
   * Note: Modal cannot be dismissed without action.
   */
  onAction?: () => void;
}

export const TrialExpiredModal = ({ onAction }: TrialExpiredModalProps) => {
  const navigate = useNavigate();
  const { isTrialExpired } = useTrialStatus();

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@flymusic.se?subject=Trial%20Expired%20-%20Help%20Needed';
    onAction?.();
  };

  const handleLearnMore = () => {
    navigate('/pricing');
    onAction?.();
  };

  // Only show when trial is expired
  if (!isTrialExpired) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        // Prevent closing via escape or clicking outside
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <DialogTitle className="text-xl">Your trial has ended</DialogTitle>
          <DialogDescription className="text-base">
            Thank you for trying FlyMusic! Your trial period has concluded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* MVP Notice */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Badge variant="secondary" className="mb-2">
              Coming after MVP
            </Badge>
            <p className="text-sm text-muted-foreground">
              Premium subscription plans are being finalized and will be available soon.
              We'll notify you when they launch.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full"
              onClick={handleContactSupport}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLearnMore}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Learn More
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Our team is here to assist with any questions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
