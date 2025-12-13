import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface SmartLinkSuspendedStateProps {
  suspensionReason: string;
  suspensionType: string;
  suspendedUntil?: string | null;
  onContactSupport?: () => void;
}

export function SmartLinkSuspendedState({
  suspensionReason,
  suspensionType,
  suspendedUntil,
  onContactSupport,
}: SmartLinkSuspendedStateProps) {
  const isPermanent = suspensionType === "permanent";
  
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Ban className="h-5 w-5" />
          Smart Link Page Suspended
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Reason:</p>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {suspensionReason}
          </p>
        </div>

        {!isPermanent && suspendedUntil && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Will be restored on:{" "}
              <span className="font-medium">
                {format(new Date(suspendedUntil), "PPP")}
              </span>
            </span>
          </div>
        )}

        {isPermanent && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">Permanent Suspension</p>
              <p className="text-muted-foreground">
                Your smart link page has been permanently suspended. 
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button variant="outline" onClick={onContactSupport}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
