import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

interface QualitySelectorProps {
  levels: QualityLevel[];
  currentLevel: number;
  onLevelChange: (levelIndex: number) => void;
  className?: string;
}

/**
 * QualitySelector - Quality picker for HLS streams
 * Per SUPER CARD:
 * - Default: Auto (ABR)
 * - Manual override: 360p, 480p, 720p, 1080p
 * - Non-intrusive UI (dropdown, not modal)
 * - Only for HLS streams (not WebRTC)
 */
export function QualitySelector({
  levels,
  currentLevel,
  onLevelChange,
  className,
}: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLevelLabel = levels.find(l => l.index === currentLevel)?.label || 'Auto';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm",
            "gap-1.5 px-2 h-8",
            className
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{currentLevelLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-40 bg-card/95 backdrop-blur-sm"
      >
        <DropdownMenuLabel className="text-xs">Quality</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {levels.map((level) => (
          <DropdownMenuItem
            key={level.index}
            onClick={() => onLevelChange(level.index)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="text-sm">
              {level.label}
              {level.index === -1 && (
                <span className="text-muted-foreground text-xs ml-1">
                  (recommended)
                </span>
              )}
            </span>
            {currentLevel === level.index && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
