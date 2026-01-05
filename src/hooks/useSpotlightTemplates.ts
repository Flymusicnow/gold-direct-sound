import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpotlightTemplate {
  id: string;
  name: string;
  category: 'release' | 'tour' | 'merch' | 'announcement' | 'custom';
  description: string | null;
  thumbnail_url: string | null;
  layout_config: Record<string, unknown>;
  is_premium: boolean;
  sort_order: number;
}

export function useSpotlightTemplates() {
  return useQuery({
    queryKey: ['spotlight-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotlight_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching spotlight templates:', error);
        return [];
      }

      return (data || []) as SpotlightTemplate[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - templates don't change often
  });
}
