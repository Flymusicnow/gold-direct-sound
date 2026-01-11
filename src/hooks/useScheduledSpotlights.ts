import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SpotlightMedia } from "./useArtistSpotlight";

export function useScheduledSpotlights(artistId: string | undefined) {
  return useQuery({
    queryKey: ['scheduled-spotlights', artistId],
    queryFn: async (): Promise<SpotlightMedia[]> => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('artist_spotlight_media')
        .select('*')
        .eq('artist_id', artistId)
        .eq('publish_status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled spotlights:', error);
        return [];
      }

      return (data || []) as SpotlightMedia[];
    },
    enabled: !!artistId,
  });
}

export function useDraftSpotlights(artistId: string | undefined) {
  return useQuery({
    queryKey: ['draft-spotlights', artistId],
    queryFn: async (): Promise<SpotlightMedia[]> => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('artist_spotlight_media')
        .select('*')
        .eq('artist_id', artistId)
        .eq('publish_status', 'draft')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching draft spotlights:', error);
        return [];
      }

      return (data || []) as SpotlightMedia[];
    },
    enabled: !!artistId,
  });
}
