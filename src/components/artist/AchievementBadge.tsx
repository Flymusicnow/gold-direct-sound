import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export function AchievementBadge({ icon, name, description, unlocked, unlockedAt }: AchievementBadgeProps) {
  const isMobile = useIsMobile();

  const badgeContent = (
    <div
      className={`relative group cursor-pointer transition-all ${
        unlocked
          ? "opacity-100 hover:scale-105 active:scale-95"
          : "opacity-30 grayscale"
      }`}
    >
      {/* Badge Circle */}
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
          unlocked
            ? "bg-gradient-gold border-primary shadow-lg shadow-primary/20"
            : "bg-muted border-border"
        }`}
      >
        {icon}
      </div>

      {/* Locked Overlay */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50">
          <span className="text-xs font-bold">🔒</span>
        </div>
      )}
    </div>
  );

  const infoContent = (
    <div className="space-y-1">
      <p className="font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {unlocked && unlockedAt && (
        <p className="text-xs text-primary pt-1">
          Unlocked {formatDistanceToNow(new Date(unlockedAt), { addSuffix: true })}
        </p>
      )}
      {!unlocked && (
        <p className="text-xs text-muted-foreground pt-1">
          Keep working to unlock this achievement!
        </p>
      )}
    </div>
  );

  // On mobile: use Popover (tap to open/close)
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {badgeContent}
        </PopoverTrigger>
        <PopoverContent className="max-w-[200px] border-primary/20">
          {infoContent}
        </PopoverContent>
      </Popover>
    );
  }

  // On desktop: use Tooltip (hover to show)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badgeContent}
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] border-primary/20">
        {infoContent}
      </TooltipContent>
    </Tooltip>
  );
}
