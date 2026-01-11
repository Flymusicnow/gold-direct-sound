import { Hand, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStageRequests } from "@/hooks/useStageRequests";
import { cn } from "@/lib/utils";

interface RaiseHandButtonProps {
  streamId: string;
  className?: string;
}

/**
 * RaiseHandButton - Fan-facing button to request stage access
 * Per SUPER CARD: Raise Hand creates a request, not a connection
 */
export function RaiseHandButton({ streamId, className }: RaiseHandButtonProps) {
  const { myRequest, raiseHand, lowerHand, isLoading } = useStageRequests(streamId, false);
  
  const hasPendingRequest = myRequest?.status === 'pending';
  const isApproved = myRequest?.status === 'approved';
  const isOnStage = myRequest?.status === 'on_stage';

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Already on stage
  if (isOnStage) {
    return (
      <Button 
        variant="default"
        className={cn("bg-green-600 hover:bg-green-700", className)}
        disabled
      >
        <Hand className="h-4 w-4 mr-2" />
        On Stage
      </Button>
    );
  }

  // Request approved - joining soon
  if (isApproved) {
    return (
      <Button 
        variant="default"
        className={cn("bg-primary animate-pulse", className)}
        disabled
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Joining Stage...
      </Button>
    );
  }

  // Pending request - can lower hand
  if (hasPendingRequest) {
    return (
      <Button 
        variant="outline"
        onClick={lowerHand}
        className={cn("border-primary text-primary", className)}
      >
        <X className="h-4 w-4 mr-2" />
        Cancel Request
      </Button>
    );
  }

  // No request - can raise hand
  return (
    <Button 
      variant="outline"
      onClick={raiseHand}
      className={className}
    >
      <Hand className="h-4 w-4 mr-2" />
      Raise Hand
    </Button>
  );
}
