import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface BannerPositionSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * Y-axis banner position slider (SUPER CARD - only Y-axis allowed)
 * 0% = Top, 50% = Center, 100% = Bottom
 */
export function BannerPositionSlider({
  value,
  onChange,
  disabled = false,
}: BannerPositionSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Banner Position</Label>
        <span className="text-xs text-muted-foreground">
          {value === 0 ? 'Top' : value === 100 ? 'Bottom' : `${value}%`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Top</span>
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground">Bottom</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Adjust where the banner image is positioned vertically
      </p>
    </div>
  );
}
