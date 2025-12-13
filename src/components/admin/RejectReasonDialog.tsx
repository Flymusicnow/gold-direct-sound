import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, XCircle } from "lucide-react";

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (reason: string, permanentlyBlock: boolean) => Promise<void>;
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [permanentlyBlock, setPermanentlyBlock] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    
    setLoading(true);
    try {
      await onConfirm(reason, permanentlyBlock);
      onOpenChange(false);
      setReason("");
      setPermanentlyBlock(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Reject {count > 1 ? `${count} Links` : 'Link'}
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting {count > 1 ? 'these links' : 'this link'}. 
            This will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g., Malicious URL, Terms violation, Suspicious content..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="permanently-block"
              checked={permanentlyBlock}
              onCheckedChange={(checked) => setPermanentlyBlock(checked === true)}
            />
            <Label
              htmlFor="permanently-block"
              className="text-sm font-normal cursor-pointer"
            >
              Permanently block {count > 1 ? 'these URLs' : 'this URL'} from being added again
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject {count > 1 ? 'All' : 'Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
