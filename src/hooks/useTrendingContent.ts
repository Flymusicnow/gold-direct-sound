import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingItem {
  content_id: string;
  content_type: 'video' | 'track';
  title: string;
  media_url: string;
  cover_url: string | null;
  artist_id: string;
  artist_name: string;
  artist_avatar: string | null;
  artist_user_id: string;
  genre: string | null;
  trending_score: number;
  plays: number;
  likes: number;
  spotlight_votes: number;
}

const CACHE_TTL = 30 * 1000; // 30 seconds for trending (more frequent updates)
let trendingCache: { data: TrendingItem[]; timestamp: number } | null = null;

export function useTrendingContent(hours = 48, limit = 10) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = useCallback(async () => {
    // Check cache
    if (trendingCache && Date.now() - trendingCache.timestamp < CACHE_TTL) {
      setItems(trendingCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_trending_content', {
        _hours: hours,
        _limit: limit,
      });

      if (error) throw error;

      const newItems = (data || []) as TrendingItem[];
      setItems(newItems);
      
      // Cache result
      trendingCache = { data: newItems, timestamp: Date.now() };
    } catch (error) {
      console.error('Error fetching trending content:', error);
    } finally {
      setLoading(false);
    }
  }, [hours, limit]);

  useEffect(() => {
    fetchTrending();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchTrending, 30000);
    
    return () => clearInterval(interval);
  }, [fetchTrending]);

  return {
    items,
    loading,
    refresh: fetchTrending,
  };
}
