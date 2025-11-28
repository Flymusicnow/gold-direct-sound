import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export function AchievementBadge({ icon, name, description, unlocked, unlockedAt }: AchievementBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`relative group cursor-pointer transition-all ${
              unlocked
                ? "opacity-100 hover:scale-105"
                : "opacity-30 grayscale"
            }`}
          >
            {/* Badge Circle */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
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
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] border-primary/20">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
