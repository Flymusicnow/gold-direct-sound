import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  variant?: "mini" | "full";
  className?: string;
}

export function VerifiedBadge({ variant = "mini", className }: VerifiedBadgeProps) {
  if (variant === "mini") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeCheck className={cn("h-4 w-4 text-blue-500 fill-blue-500/20", className)} />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Artist</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("inline-flex items-center gap-1 text-blue-500", className)}>
          <BadgeCheck className="h-4 w-4 fill-blue-500/20" />
          <span className="text-xs font-medium">Verified</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>This artist has completed identity verification</p>
      </TooltipContent>
    </Tooltip>
  );
}
