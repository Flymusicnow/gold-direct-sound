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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Ban, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface SuspendPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageSlug: string;
  artistName: string;
  onSuspend: (type: "temporary" | "permanent", reason: string, until?: Date) => Promise<void>;
}

export function SuspendPageDialog({
  open,
  onOpenChange,
  pageSlug,
  artistName,
  onSuspend,
}: SuspendPageDialogProps) {
  const [suspensionType, setSuspensionType] = useState<"temporary" | "permanent">("temporary");
  const [reason, setReason] = useState("");
  const [suspendUntil, setSuspendUntil] = useState<Date | undefined>(addDays(new Date(), 7));
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    if (!reason.trim()) return;
    
    setLoading(true);
    try {
      await onSuspend(
        suspensionType,
        reason,
        suspensionType === "temporary" ? suspendUntil : undefined
      );
      onOpenChange(false);
      setReason("");
      setSuspensionType("temporary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Suspend Smart Link Page
          </DialogTitle>
          <DialogDescription>
            Suspend <span className="font-mono text-foreground">@{pageSlug}</span> by {artistName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Suspension Type */}
          <div className="space-y-3">
            <Label>Suspension Type</Label>
            <RadioGroup
              value={suspensionType}
              onValueChange={(v) => setSuspensionType(v as "temporary" | "permanent")}
              className="grid grid-cols-2 gap-4"
            >
              <div className={cn(
                "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                suspensionType === "temporary" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              )}>
                <RadioGroupItem value="temporary" id="temporary" />
                <Label htmlFor="temporary" className="cursor-pointer font-normal">
                  Temporary
                </Label>
              </div>
              <div className={cn(
                "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                suspensionType === "permanent" ? "border-destructive bg-destructive/5" : "border-border hover:border-muted-foreground"
              )}>
                <RadioGroupItem value="permanent" id="permanent" />
                <Label htmlFor="permanent" className="cursor-pointer font-normal">
                  Permanent
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Picker for Temporary */}
          {suspensionType === "temporary" && (
            <div className="space-y-2">
              <Label>Suspend Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !suspendUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {suspendUntil ? format(suspendUntil, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={suspendUntil}
                    onSelect={setSuspendUntil}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Suspension Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this page is being suspended..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be shown to the artist
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">Important</p>
              <p className="text-muted-foreground">
                {suspensionType === "permanent" 
                  ? "This will permanently disable the artist's smart link page. They will need to contact support to restore it."
                  : "The page will be automatically restored after the suspension period ends."
                }
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSuspend}
            disabled={!reason.trim() || loading || (suspensionType === "temporary" && !suspendUntil)}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Suspend Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
