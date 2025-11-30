import { useState } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface InfoTooltipProps {
  title: string;
  description: string;
  forRole?: "fan" | "artist";
  learnLink?: string;
  className?: string;
}

export function InfoTooltip({
  title,
  description,
  forRole,
  learnLink,
  className,
}: InfoTooltipProps) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Role filtering
  if (forRole && profile?.role !== forRole) {
    return null;
  }

  const content = (
    <div className="space-y-2 max-w-xs">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
      {learnLink && (
        <Link
          to={learnLink}
          className="text-xs text-primary hover:text-primary/80 underline inline-block mt-1"
          onClick={() => setOpen(false)}
        >
          Learn more →
        </Link>
      )}
    </div>
  );

  const iconButton = (
    <button
      className={cn(
        "inline-flex items-center justify-center",
        "w-5 h-5 rounded-full",
        "border border-primary/30 bg-primary/10",
        "hover:bg-primary/20 hover:border-primary/50",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        "cursor-pointer",
        // Touch target for mobile
        "touch-manipulation",
        "active:scale-95",
        className
      )}
      aria-label={`Info about ${title}`}
    >
      <Info className="h-3 w-3 text-primary" />
    </button>
  );

  // Mobile: Use Popover (tap to open, tap outside to close)
  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{iconButton}</PopoverTrigger>
        <PopoverContent
          className="w-80 border-primary/20 bg-popover/95 backdrop-blur-sm shadow-lg"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop: Use Tooltip (hover and keyboard focus)
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
      <TooltipContent
        className="max-w-xs border-primary/20 bg-popover/95 backdrop-blur-sm shadow-lg"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
