import { useVideoHeatmap } from '@/hooks/useVideoHeatmap';
import { Flame, TrendingDown } from 'lucide-react';

interface VideoEngagementHeatmapProps {
  videoId: string;
  segmentDuration?: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function VideoEngagementHeatmap({ 
  videoId, 
  segmentDuration = 5 
}: VideoEngagementHeatmapProps) {
  const { heatmapData, isLoading } = useVideoHeatmap(videoId, segmentDuration);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded mb-2" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (!heatmapData || heatmapData.segments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No engagement data yet
      </div>
    );
  }

  const { segments, maxViews, peakTime, peakViews, dropOffTime, dropOffPercent } = heatmapData;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground">
        Engagement Heatmap
      </div>
      
      {/* Heatmap visualization */}
      <div className="relative">
        <div className="flex items-end h-16 gap-[2px] bg-muted/20 rounded-lg p-2">
          {segments.map((segment, index) => {
            const heightPercent = maxViews > 0 ? (segment.views / maxViews) * 100 : 0;
            const isPeak = segment.time === peakTime;
            const isDropOff = segment.time === dropOffTime;
            
            return (
              <div
                key={segment.time}
                className="flex-1 group relative"
                style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
              >
                <div
                  className={`w-full rounded-sm transition-all ${
                    isPeak 
                      ? 'bg-[hsl(var(--primary))]' 
                      : isDropOff
                        ? 'bg-destructive/60'
                        : 'bg-[hsl(var(--primary))]/70'
                  }`}
                  style={{ height: `${heightPercent}%`, minHeight: segment.views > 0 ? '4px' : '2px' }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {formatTime(segment.time)}: {segment.views} views
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Time markers */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0:00</span>
          {segments.length > 2 && (
            <span>{formatTime(segments[Math.floor(segments.length / 2)].time)}</span>
          )}
          <span>{formatTime(segments[segments.length - 1].time)}</span>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-2">
        {peakTime !== undefined && peakViews !== undefined && (
          <div className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg p-2">
            <Flame className="w-4 h-4 text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Peak</div>
              <div className="text-muted-foreground">
                {formatTime(peakTime)} ({peakViews} views)
              </div>
            </div>
          </div>
        )}
        
        {dropOffTime !== undefined && dropOffPercent !== undefined && (
          <div className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg p-2">
            <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Drop-off</div>
              <div className="text-muted-foreground">
                {formatTime(dropOffTime)} ({dropOffPercent}% retention)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
