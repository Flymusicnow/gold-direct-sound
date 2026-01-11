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
import { Loader2 } from "lucide-react";

interface InviteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fanName: string;
  fanAvatarUrl?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const InviteConfirmationDialog = ({
  open,
  onOpenChange,
  fanName,
  fanAvatarUrl,
  onConfirm,
  isLoading = false,
}: InviteConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center space-y-4">
          {fanAvatarUrl ? (
            <img
              src={fanAvatarUrl}
              alt={fanName}
              className="w-16 h-16 rounded-full object-cover mx-auto"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-2xl font-bold">
              {fanName.charAt(0)}
            </div>
          )}
          <AlertDialogTitle>Invite {fanName}?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            When you confirm, {fanName} will receive a prompt to join your stage.
            You'll be notified when they accept.
            <br />
            <br />
            <span className="text-muted-foreground">
              You can remove them at any time.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
          <AlertDialogCancel 
            className="flex-1 min-h-[44px] mt-0"
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="flex-1 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              "Invite"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
