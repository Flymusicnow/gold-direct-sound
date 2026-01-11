import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  templateCategory: string;
  views: number;
  avgDurationMs: number;
  clickCount: number;
  clickRate: number;
}

export function useTemplateAnalytics(artistId: string | undefined) {
  return useQuery({
    queryKey: ['template-analytics', artistId],
    queryFn: async (): Promise<TemplatePerformance[]> => {
      if (!artistId) return [];

      // Get all spotlight views with template data for this artist
      const { data: views, error: viewsError } = await supabase
        .from('spotlight_views')
        .select(`
          template_id,
          view_duration_ms,
          clicked_link
        `)
        .eq('artist_id', artistId)
        .not('template_id', 'is', null);

      if (viewsError) {
        console.error('Error fetching template views:', viewsError);
        return [];
      }

      // Get template info
      const { data: templates, error: templatesError } = await supabase
        .from('spotlight_templates')
        .select('id, name, category');

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        return [];
      }

      // Group views by template
      const templateMap = new Map<string, {
        views: number;
        totalDuration: number;
        clicks: number;
      }>();

      views?.forEach((view) => {
        const templateId = view.template_id;
        if (!templateId) return;

        const current = templateMap.get(templateId) || {
          views: 0,
          totalDuration: 0,
          clicks: 0,
        };

        current.views++;
        current.totalDuration += view.view_duration_ms || 0;
        if (view.clicked_link) current.clicks++;

        templateMap.set(templateId, current);
      });

      // Build result with template info
      const templateLookup = new Map(templates?.map(t => [t.id, t]) || []);
      
      const results: TemplatePerformance[] = [];
      templateMap.forEach((stats, templateId) => {
        const template = templateLookup.get(templateId);
        if (!template) return;

        results.push({
          templateId,
          templateName: template.name,
          templateCategory: template.category,
          views: stats.views,
          avgDurationMs: stats.views > 0 ? stats.totalDuration / stats.views : 0,
          clickCount: stats.clicks,
          clickRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
        });
      });

      // Sort by views descending
      return results.sort((a, b) => b.views - a.views);
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
