import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ABTest {
  id: string;
  artist_id: string;
  name: string;
  variant_a_media_id: string;
  variant_b_media_id: string;
  status: 'active' | 'completed' | 'cancelled';
  winner_variant: 'A' | 'B' | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface ABTestWithStats extends ABTest {
  variant_a_views: number;
  variant_a_clicks: number;
  variant_a_avg_duration: number;
  variant_b_views: number;
  variant_b_clicks: number;
  variant_b_avg_duration: number;
}

export function useABTests(artistId: string | undefined) {
  return useQuery({
    queryKey: ['ab-tests', artistId],
    queryFn: async (): Promise<ABTest[]> => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('spotlight_ab_tests')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching A/B tests:', error);
        return [];
      }

      return (data || []) as ABTest[];
    },
    enabled: !!artistId,
  });
}

export function useABTestWithStats(testId: string | undefined) {
  return useQuery({
    queryKey: ['ab-test-stats', testId],
    queryFn: async (): Promise<ABTestWithStats | null> => {
      if (!testId) return null;

      // Get the test
      const { data: test, error: testError } = await supabase
        .from('spotlight_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError || !test) {
        console.error('Error fetching A/B test:', testError);
        return null;
      }

      // Get views for variant A
      const { data: variantAViews } = await supabase
        .from('spotlight_views')
        .select('view_duration_ms, clicked_link')
        .eq('ab_test_id', testId)
        .eq('ab_variant', 'A');

      // Get views for variant B
      const { data: variantBViews } = await supabase
        .from('spotlight_views')
        .select('view_duration_ms, clicked_link')
        .eq('ab_test_id', testId)
        .eq('ab_variant', 'B');

      const calcStats = (views: typeof variantAViews) => {
        if (!views || views.length === 0) {
          return { views: 0, clicks: 0, avgDuration: 0 };
        }
        const totalDuration = views.reduce((sum, v) => sum + (v.view_duration_ms || 0), 0);
        const clicks = views.filter(v => v.clicked_link).length;
        return {
          views: views.length,
          clicks,
          avgDuration: totalDuration / views.length,
        };
      };

      const aStats = calcStats(variantAViews);
      const bStats = calcStats(variantBViews);

      return {
        ...test,
        variant_a_views: aStats.views,
        variant_a_clicks: aStats.clicks,
        variant_a_avg_duration: aStats.avgDuration,
        variant_b_views: bStats.views,
        variant_b_clicks: bStats.clicks,
        variant_b_avg_duration: bStats.avgDuration,
      } as ABTestWithStats;
    },
    enabled: !!testId,
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });
}

export function useCreateABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artistId,
      name,
      variantAMediaId,
      variantBMediaId,
      endDate,
    }: {
      artistId: string;
      name: string;
      variantAMediaId: string;
      variantBMediaId: string;
      endDate?: Date;
    }) => {
      const { data, error } = await supabase
        .from('spotlight_ab_tests')
        .insert({
          artist_id: artistId,
          name,
          variant_a_media_id: variantAMediaId,
          variant_b_media_id: variantBMediaId,
          end_date: endDate?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests', variables.artistId] });
      toast.success('A/B test created!');
    },
    onError: (error) => {
      console.error('Error creating A/B test:', error);
      toast.error('Failed to create A/B test');
    },
  });
}

export function useEndABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      artistId,
      winnerVariant,
    }: {
      testId: string;
      artistId: string;
      winnerVariant?: 'A' | 'B';
    }) => {
      const { error } = await supabase
        .from('spotlight_ab_tests')
        .update({
          status: 'completed',
          winner_variant: winnerVariant || null,
          end_date: new Date().toISOString(),
        })
        .eq('id', testId);

      if (error) throw error;
      return { testId, artistId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests', variables.artistId] });
      queryClient.invalidateQueries({ queryKey: ['ab-test-stats', variables.testId] });
      toast.success('A/B test ended');
    },
    onError: (error) => {
      console.error('Error ending A/B test:', error);
      toast.error('Failed to end A/B test');
    },
  });
}

// Helper to get which variant a user should see
export function getABVariant(testId: string, fanId: string): 'A' | 'B' {
  // Simple deterministic hash based on testId + fanId
  const combined = testId + fanId;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 2 === 0 ? 'A' : 'B';
}
