import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  variant?: "mini" | "full";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedBadge({ variant = "mini", size = "md", className }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (variant === "mini") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeCheck className={cn(sizeClasses[size], "text-blue-500 fill-blue-500/20", className)} />
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
