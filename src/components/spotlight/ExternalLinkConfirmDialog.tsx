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
import { ExternalLink } from "lucide-react";

interface ExternalLinkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  platform: string | null;
  onConfirm: () => void;
}

export function ExternalLinkConfirmDialog({
  open,
  onOpenChange,
  url,
  platform,
  onConfirm,
}: ExternalLinkConfirmDialogProps) {
  const displayPlatform = platform || 'external site';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            Leaving FlyMusic
          </AlertDialogTitle>
          <AlertDialogDescription>
            You're about to visit <strong className="capitalize">{displayPlatform}</strong>. 
            External links are not verified by FlyMusic.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {url && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm break-all font-mono">
            {url}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel>Stay on FlyMusic</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-muted text-foreground hover:bg-muted/80"
          >
            Continue to {displayPlatform}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
