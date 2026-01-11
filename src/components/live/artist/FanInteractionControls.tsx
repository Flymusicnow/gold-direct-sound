import { useState } from "react";
import { UserPlus, Users, Volume2, VolumeX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface StageUser {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isMuted: boolean;
}

interface StageRequest {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  requestedAt: string;
}

interface FanInteractionControlsProps {
  stageRequests: StageRequest[];
  onStageUsers: StageUser[];
  onInviteFan: () => void;
  onViewSupporters: () => void;
  onApproveRequest: (requestId: string) => void;
  onDenyRequest: (requestId: string) => void;
  onMuteFan: (userId: string, mute: boolean) => void;
  onRemoveFan: (userId: string) => void;
  onClearAllFromStage: () => void;
  className?: string;
}

export const FanInteractionControls = ({
  stageRequests,
  onStageUsers,
  onInviteFan,
  onViewSupporters,
  onApproveRequest,
  onDenyRequest,
  onMuteFan,
  onRemoveFan,
  onClearAllFromStage,
  className,
}: FanInteractionControlsProps) => {
  const [showClearDialog, setShowClearDialog] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onInviteFan}
          className="flex-1 min-h-[44px]"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Fan
        </Button>
        <Button
          variant="ghost"
          onClick={onViewSupporters}
          className="min-h-[44px] min-w-[44px]"
        >
          <Users className="h-4 w-4" />
        </Button>
      </div>

      {/* Stage Requests Queue */}
      {stageRequests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Stage Requests</h4>
            <Badge variant="secondary" className="text-xs">
              {stageRequests.length}
            </Badge>
          </div>
          <ScrollArea className="max-h-32">
            <div className="space-y-2">
              {stageRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  {request.avatarUrl ? (
                    <img
                      src={request.avatarUrl}
                      alt={request.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {request.displayName.charAt(0)}
                    </div>
                  )}
                  <span className="flex-1 text-sm truncate">{request.displayName}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onApproveRequest(request.id)}
                      className="min-h-[32px] min-w-[32px] px-2"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDenyRequest(request.id)}
                      className="min-h-[32px] min-w-[32px] px-2"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* On Stage Now */}
      {onStageUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-green-500">On Stage</h4>
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setShowClearDialog(true)}
              >
                Clear All
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all fans from stage?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately remove all fans currently on stage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onClearAllFromStage();
                      setShowClearDialog(false);
                    }}
                    className="min-h-[44px] bg-destructive text-destructive-foreground"
                  >
                    Remove All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="space-y-2">
            {onStageUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-medium">
                    {user.displayName.charAt(0)}
                  </div>
                )}
                <span className="flex-1 text-sm truncate">{user.displayName}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMuteFan(user.userId, !user.isMuted)}
                    className="min-h-[32px] min-w-[32px] px-2"
                    title={user.isMuted ? "Unmute" : "Mute"}
                  >
                    {user.isMuted ? (
                      <VolumeX className="h-4 w-4 text-red-500" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveFan(user.userId)}
                    className="min-h-[32px] min-w-[32px] px-2 hover:text-destructive"
                    title="Remove from stage"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
