import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { TrendingUp, Flame, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MomentumMetricDisplayProps {
  plays?: number;
  likes?: number;
  shares?: number;
  timeWindow?: string;
}

const MomentumMetricDisplay: React.FC<MomentumMetricDisplayProps> = ({
  plays = 0,
  likes = 0,
  shares = 0,
  timeWindow = '48h',
}) => {
  const trustLayerEnabled = useFeatureFlag('TRUST_LAYER_ENABLED');

  if (!trustLayerEnabled) return null;

  // Calculate momentum score (simplified visualization)
  const momentum = Math.round((plays * 1.5 + likes * 2 + shares * 3) / 10);
  const momentumLevel = momentum > 100 ? 'hot' : momentum > 50 ? 'rising' : 'steady';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs">
            {momentumLevel === 'hot' ? (
              <Flame className="h-3 w-3 text-orange-500" />
            ) : (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            <span className="font-medium">
              {momentumLevel === 'hot' ? 'Hot' : momentumLevel === 'rising' ? 'Rising' : 'Steady'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Momentum Metric</p>
            <p className="text-xs text-muted-foreground">
              Baserat på aktivitet de senaste {timeWindow}:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 rounded bg-muted/50">
                <div className="font-medium">{plays}</div>
                <div className="text-muted-foreground">plays</div>
              </div>
              <div className="text-center p-2 rounded bg-muted/50">
                <div className="font-medium">{likes}</div>
                <div className="text-muted-foreground">likes</div>
              </div>
              <div className="text-center p-2 rounded bg-muted/50">
                <div className="font-medium">{shares}</div>
                <div className="text-muted-foreground">shares</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Uppdateras varje timme
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MomentumMetricDisplay;
