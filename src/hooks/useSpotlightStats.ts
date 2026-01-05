import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpotlightStats {
  totalViews: number;
  uniqueViewers: number;
  averageViewDuration: number;
  clickThroughRate: number;
  internalClicks: number;
  externalClicks: number;
  viewsByMedia: { mediaId: string; views: number; clicks: number }[];
  viewsLast7Days: number;
  viewsLast30Days: number;
}

export function useSpotlightStats(artistId: string | undefined) {
  return useQuery({
    queryKey: ['spotlight-stats', artistId],
    queryFn: async (): Promise<SpotlightStats> => {
      if (!artistId) {
        return {
          totalViews: 0,
          uniqueViewers: 0,
          averageViewDuration: 0,
          clickThroughRate: 0,
          internalClicks: 0,
          externalClicks: 0,
          viewsByMedia: [],
          viewsLast7Days: 0,
          viewsLast30Days: 0,
        };
      }

      const { data, error } = await supabase
        .from('spotlight_views')
        .select('*')
        .eq('artist_id', artistId);

      if (error) {
        console.error('Error fetching spotlight stats:', error);
        throw error;
      }

      const views = data || [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate stats
      const totalViews = views.length;
      const uniqueSessions = new Set(views.map(v => v.session_id)).size;
      const totalDuration = views.reduce((sum, v) => sum + (v.view_duration_ms || 0), 0);
      const averageViewDuration = totalViews > 0 ? totalDuration / totalViews : 0;
      
      const clickedViews = views.filter(v => v.clicked_link);
      const clickThroughRate = totalViews > 0 ? (clickedViews.length / totalViews) * 100 : 0;
      
      const internalClicks = clickedViews.filter(v => v.link_type === 'internal').length;
      const externalClicks = clickedViews.filter(v => v.link_type === 'external').length;

      // Views by media
      const mediaViewMap = new Map<string, { views: number; clicks: number }>();
      views.forEach(v => {
        const existing = mediaViewMap.get(v.spotlight_media_id) || { views: 0, clicks: 0 };
        existing.views++;
        if (v.clicked_link) existing.clicks++;
        mediaViewMap.set(v.spotlight_media_id, existing);
      });
      
      const viewsByMedia = Array.from(mediaViewMap.entries()).map(([mediaId, stats]) => ({
        mediaId,
        ...stats
      }));

      // Time-based views
      const viewsLast7Days = views.filter(v => new Date(v.created_at) >= sevenDaysAgo).length;
      const viewsLast30Days = views.filter(v => new Date(v.created_at) >= thirtyDaysAgo).length;

      return {
        totalViews,
        uniqueViewers: uniqueSessions,
        averageViewDuration,
        clickThroughRate,
        internalClicks,
        externalClicks,
        viewsByMedia,
        viewsLast7Days,
        viewsLast30Days,
      };
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
