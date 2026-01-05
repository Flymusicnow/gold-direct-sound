import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpotlightMedia {
  id: string;
  artist_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  display_duration_seconds: number;
  link_type: 'none' | 'internal' | 'external';
  link_url: string | null;
  link_platform: string | null;
  link_label: string | null;
  template_id: string | null;
  template_data: Record<string, unknown>;
  created_at: string;
}

export function useArtistSpotlight(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist-spotlight', artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data, error } = await supabase
        .from('artist_spotlight_media')
        .select('*')
        .eq('artist_id', artistId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching spotlight media:', error);
        return [];
      }

      // Additional client-side filtering for edge cases
      const now = new Date();
      return (data || []).filter(item => {
        if (!item.is_active) return false;
        const startOk = !item.start_date || new Date(item.start_date) <= now;
        const endOk = !item.end_date || new Date(item.end_date) >= now;
        return startOk && endOk;
      }) as SpotlightMedia[];
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for artist studio - fetches ALL spotlight media including inactive/scheduled
export function useArtistSpotlightManagement(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist-spotlight-management', artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data, error } = await supabase
        .from('artist_spotlight_media')
        .select('*')
        .eq('artist_id', artistId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching spotlight media for management:', error);
        return [];
      }

      return (data || []) as SpotlightMedia[];
    },
    enabled: !!artistId,
  });
}
