import { useVerificationMode } from '@/contexts/VerificationModeContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, FlaskConical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const VERIFICATION_DWELL_TIME = 10; // seconds - must match context

export function VerificationBanner() {
  const {
    isVerificationMode,
    issueId,
    verificationStatus,
    dwellTime,
    errors,
    cancelVerification,
  } = useVerificationMode();

  if (!isVerificationMode) return null;

  const remainingTime = Math.max(0, VERIFICATION_DWELL_TIME - dwellTime);
  const progress = Math.min(100, (dwellTime / VERIFICATION_DWELL_TIME) * 100);

  const getBannerStyles = () => {
    switch (verificationStatus) {
      case 'passed':
        return 'bg-green-500/95 text-white border-green-600';
      case 'failed':
        return 'bg-destructive/95 text-destructive-foreground border-destructive';
      case 'pending':
      default:
        return 'bg-amber-500/95 text-amber-950 border-amber-600';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'pending':
      default:
        return <FlaskConical className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    const shortId = issueId?.slice(0, 8) || 'unknown';
    
    switch (verificationStatus) {
      case 'passed':
        return `Fix verified for ISSUE-${shortId}! Redirecting...`;
      case 'failed':
        return `Verification failed for ISSUE-${shortId} - ${errors.length} error(s) detected`;
      case 'pending':
      default:
        return (
          <>
            Testing fix for <span className="font-mono font-semibold">ISSUE-{shortId}</span>
            {remainingTime > 0 && (
              <span className="ml-2 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {remainingTime}s
              </span>
            )}
          </>
        );
    }
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999] px-4 py-3 border-b shadow-lg',
        'flex items-center justify-between gap-4',
        'safe-area-top',
        getBannerStyles()
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getStatusIcon()}
        <div className="flex items-center gap-2 text-sm font-medium truncate">
          {getStatusText()}
        </div>
      </div>
      
      {/* Progress bar for pending state */}
      {verificationStatus === 'pending' && (
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-1.5 bg-amber-700/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-950/60 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Error details for failed state */}
      {verificationStatus === 'failed' && errors.length > 0 && (
        <div className="hidden md:block text-xs opacity-80 truncate max-w-xs">
          {errors[0].message}
        </div>
      )}
      
      {/* Cancel button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={cancelVerification}
        className={cn(
          'flex-shrink-0 h-7 w-7 p-0',
          verificationStatus === 'passed' 
            ? 'text-green-100 hover:bg-green-600/50' 
            : verificationStatus === 'failed'
            ? 'text-destructive-foreground hover:bg-destructive/80'
            : 'text-amber-900 hover:bg-amber-600/50'
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Cancel verification</span>
      </Button>
    </div>
  );
}
