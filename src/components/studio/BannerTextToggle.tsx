import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

interface BannerTextToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  hasBanner: boolean;
  disabled?: boolean;
}

/**
 * Toggle to show/hide artist name on banner
 * SUPER CARD: Profile picture and follower count always visible
 */
export function BannerTextToggle({
  value,
  onChange,
  hasBanner,
  disabled = false,
}: BannerTextToggleProps) {
  // If no banner, always show name (per SUPER CARD)
  const effectiveValue = hasBanner ? value : true;
  const isDisabled = disabled || !hasBanner;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show artist name on banner</Label>
          <p className="text-xs text-muted-foreground">
            {hasBanner 
              ? "Toggle to show or hide your name over the banner"
              : "Name always shown when no banner is set"
            }
          </p>
        </div>
        <Switch
          checked={effectiveValue}
          onCheckedChange={onChange}
          disabled={isDisabled}
        />
      </div>
      
      {/* Fail-safe notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Profile picture, follower count, and location will always be visible regardless of this setting.
        </span>
      </div>
    </div>
  );
}
