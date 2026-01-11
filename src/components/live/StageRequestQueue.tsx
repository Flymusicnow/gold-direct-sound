import { Check, X, Mic, MicOff, UserX, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStageRequests } from "@/hooks/useStageRequests";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface StageRequestQueueProps {
  streamId: string;
  className?: string;
}

/**
 * StageRequestQueue - Artist-facing queue management
 * Per SUPER CARD:
 * - approve / deny / mute / kick / panic close all
 * - Rate limiting per user (handled in hook)
 */
export function StageRequestQueue({ streamId, className }: StageRequestQueueProps) {
  const {
    pendingRequests,
    onStageUsers,
    approveRequest,
    denyRequest,
    kickFromStage,
    panicCloseAll,
    isLoading,
  } = useStageRequests(streamId, true);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Stage Requests</h3>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingRequests.length}
            </Badge>
          )}
        </div>
        
        {/* Panic Button */}
        {(pendingRequests.length > 0 || onStageUsers.length > 0) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Stage?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all fans from stage and deny all pending requests. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={panicCloseAll} className="bg-destructive">
                  Clear Stage
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* On Stage Section */}
          {onStageUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                On Stage Now
              </p>
              {onStageUsers.map((request) => (
                <OnStageUserCard
                  key={request.id}
                  request={request}
                  onKick={() => kickFromStage(request.id)}
                />
              ))}
            </div>
          )}
          
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Waiting
              </p>
              {pendingRequests.map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => approveRequest(request.id)}
                  onDeny={() => denyRequest(request.id)}
                />
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {pendingRequests.length === 0 && onStageUsers.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No stage requests yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface PendingRequestCardProps {
  request: {
    id: string;
    requested_at: string;
    profile?: {
      full_name: string;
      avatar_url?: string;
    };
  };
  onApprove: () => void;
  onDeny: () => void;
}

function PendingRequestCard({ request, onApprove, onDeny }: PendingRequestCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
      <Avatar className="h-8 w-8">
        <AvatarImage src={request.profile?.avatar_url} />
        <AvatarFallback>
          {request.profile?.full_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {request.profile?.full_name || 'Anonymous'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
        </p>
      </div>
      
      <div className="flex gap-1">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
          onClick={onApprove}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDeny}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface OnStageUserCardProps {
  request: {
    id: string;
    profile?: {
      full_name: string;
      avatar_url?: string;
    };
  };
  onKick: () => void;
}

function OnStageUserCard({ request, onKick }: OnStageUserCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
      <Avatar className="h-8 w-8 ring-2 ring-green-500">
        <AvatarImage src={request.profile?.avatar_url} />
        <AvatarFallback>
          {request.profile?.full_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {request.profile?.full_name || 'Anonymous'}
        </p>
        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
          Live
        </Badge>
      </div>
      
      <div className="flex gap-1">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8"
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onKick}
        >
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
