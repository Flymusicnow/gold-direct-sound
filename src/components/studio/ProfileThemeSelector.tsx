import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getAllThemes, type ProfileTheme } from '@/lib/themes';
import { Check } from 'lucide-react';

interface ProfileThemeSelectorProps {
  value: ProfileTheme;
  onChange: (theme: ProfileTheme) => void;
  disabled?: boolean;
}

/**
 * Profile theme selector with 5 predefined brand-safe themes
 * SUPER CARD: No custom hex input allowed
 */
export function ProfileThemeSelector({
  value,
  onChange,
  disabled = false,
}: ProfileThemeSelectorProps) {
  const themes = getAllThemes();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Profile Theme</Label>
      <div className="flex flex-wrap gap-3">
        {themes.map((theme) => {
          const isSelected = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(theme.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                isSelected ? "border-primary bg-primary/10" : "border-border",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Color preview circle */}
              <div 
                className={cn(
                  "w-8 h-8 rounded-full ring-2",
                  theme.ringClass,
                  theme.shadowClass
                )}
                style={{ 
                  backgroundColor: `hsl(${theme.colorValue})`,
                  boxShadow: `0 4px 12px hsl(${theme.colorValue} / 0.4)`
                }}
              />
              
              {/* Theme name */}
              <span className={cn(
                "text-xs font-medium",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}>
                {theme.name}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Theme affects profile ring, badges, and accent colors
      </p>
    </div>
  );
}
