import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
  className?: string;
}

const DISMISS_KEY = 'flymusic_trial_banner_dismissed';

export const TrialBanner = ({ className }: TrialBannerProps) => {
  const navigate = useNavigate();
  const { trialStatus, isLoading, isTrialActive, isTrialExpired, isCheckingTrial, daysLeft } = useTrialStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  // Don't show if expired (TrialExpiredModal handles that)
  if (isTrialExpired) return null;
  
  // Don't show if dismissed
  if (isDismissed) return null;
  
  // Don't show if no trial (using new nested structure)
  if (trialStatus.trial?.state === 'none') return null;

  const isLowDays = daysLeft !== null && daysLeft <= 3;

  // Determine display text based on state
  const getDisplayText = () => {
    if (isLoading || isCheckingTrial) {
      return 'Checking trial status...';
    }
    if (daysLeft !== null) {
      return `Trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
    }
    // Null days but active state - show neutral text
    return 'Trial active';
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-4 rounded-lg border p-4',
        isLowDays 
          ? 'bg-yellow-500/10 border-yellow-500/30' 
          : 'bg-primary/5 border-primary/20',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {isLoading || isCheckingTrial ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isLowDays ? 'bg-yellow-500/20' : 'bg-primary/10'
          )}>
            {isLowDays ? (
              <Clock className="h-5 w-5 text-yellow-600" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-semibold',
              isLowDays ? 'text-yellow-700 dark:text-yellow-400' : 'text-foreground'
            )}>
              {getDisplayText()}
            </span>
            <Badge variant="secondary" className="text-xs">
              Available during trial
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            All premium features are unlocked during your trial period.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pricing')}
          className="hidden sm:flex"
        >
          View plans
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
