import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeatmapSegment {
  time: number;
  views: number;
}

interface HeatmapData {
  segments: HeatmapSegment[];
  maxViews: number;
  peakTime?: number;
  peakViews?: number;
  dropOffTime?: number;
  dropOffPercent?: number;
}

export const useVideoHeatmap = (videoId: string, segmentDuration = 5) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase.rpc('get_video_engagement_heatmap', {
          video_id_param: videoId,
          segment_duration: segmentDuration,
        });

        if (error) throw error;

        const segments = (data as unknown as HeatmapSegment[]) || [];
        
        if (segments.length === 0) {
          setHeatmapData(null);
          return;
        }

        // Calculate insights
        const maxViews = Math.max(...segments.map(s => s.views));
        const peakSegment = segments.reduce((max, seg) => 
          seg.views > max.views ? seg : max
        );
        
        // Find drop-off point (first segment with <50% of peak views)
        const dropOffThreshold = peakSegment.views * 0.5;
        const dropOffSegment = segments.find(seg => seg.views < dropOffThreshold);

        setHeatmapData({
          segments,
          maxViews,
          peakTime: peakSegment.time,
          peakViews: peakSegment.views,
          dropOffTime: dropOffSegment?.time,
          dropOffPercent: dropOffSegment 
            ? Math.round((dropOffSegment.views / peakSegment.views) * 100)
            : undefined,
        });
      } catch (error) {
        console.error('Error fetching heatmap:', error);
        setHeatmapData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchHeatmap();
    }
  }, [videoId, segmentDuration]);

  return { heatmapData, isLoading };
};
