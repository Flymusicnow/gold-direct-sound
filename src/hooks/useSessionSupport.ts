import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SessionSupport {
  totalAmount: number;
  giftCount: number;
  topSupporters: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    amount: number;
  }[];
}

export const useSessionSupport = (streamId: string | null) => {
  const [support, setSupport] = useState<SessionSupport>({
    totalAmount: 0,
    giftCount: 0,
    topSupporters: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchSupport = useCallback(async () => {
    if (!streamId) return;

    setIsLoading(true);
    try {
      // For now, we'll track reactions as a proxy for support
      // In a real implementation, this would query a gifts/tips table
      const { data: reactions, error } = await supabase
        .from("live_reactions")
        .select("user_id, created_at")
        .eq("stream_id", streamId);

      if (error) throw error;

      // Group by user and count
      const userCounts = new Map<string, number>();
      (reactions || []).forEach(r => {
        const count = userCounts.get(r.user_id) || 0;
        userCounts.set(r.user_id, count + 1);
      });

      // Convert to array and sort
      const supporters = Array.from(userCounts.entries())
        .map(([userId, count]) => ({
          userId,
          displayName: `Supporter`,
          avatarUrl: null,
          amount: count, // Using count as proxy for amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      setSupport({
        totalAmount: reactions?.length || 0,
        giftCount: reactions?.length || 0,
        topSupporters: supporters,
      });
    } catch (err) {
      console.error("Error fetching session support:", err);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    fetchSupport();

    if (!streamId) return;

    // Subscribe to new reactions
    const channel = supabase
      .channel(`support-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_reactions",
          filter: `stream_id=eq.${streamId}`,
        },
        () => {
          fetchSupport();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, fetchSupport]);

  return {
    ...support,
    isLoading,
    refetch: fetchSupport,
  };
};
