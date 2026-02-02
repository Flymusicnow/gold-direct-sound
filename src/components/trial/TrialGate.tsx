import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { TrialExpiredModal } from './TrialExpiredModal';

interface TrialGateProps {
  /**
   * Content to render when trial is active
   */
  children: ReactNode;
  
  /**
   * Optional fallback to show while checking trial status
   * Defaults to a loading spinner
   */
  loadingFallback?: ReactNode;
  
  /**
   * Optional fallback to show when there's no trial (user never started one)
   * If not provided, children are shown (graceful degradation)
   */
  noTrialFallback?: ReactNode;
}

/**
 * Higher-Order Component that gates content based on trial status.
 * 
 * - If trial is active: renders children
 * - If trial is expired: shows TrialExpiredModal (non-dismissible)
 * - If checking status: shows loading fallback
 * - If no trial: shows noTrialFallback or children (graceful degradation)
 */
export const TrialGate = ({ 
  children, 
  loadingFallback,
  noTrialFallback 
}: TrialGateProps) => {
  const { isLoading, isTrialActive, isTrialExpired, hasNoTrial, isCheckingTrial } = useTrialStatus();

  // Show loading state
  if (isLoading || isCheckingTrial) {
    return (
      <>
        {loadingFallback || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Checking trial status...
            </span>
          </div>
        )}
      </>
    );
  }

  // Show expired modal (non-dismissible)
  if (isTrialExpired) {
    return <TrialExpiredModal />;
  }

  // Handle no trial state
  if (hasNoTrial) {
    // If a fallback is provided, use it
    if (noTrialFallback) {
      return <>{noTrialFallback}</>;
    }
    // Otherwise, gracefully show content (don't block users without trial context)
    return <>{children}</>;
  }

  // Trial is active - show content
  if (isTrialActive) {
    return <>{children}</>;
  }

  // Fallback: show content (shouldn't normally reach here)
  return <>{children}</>;
};

