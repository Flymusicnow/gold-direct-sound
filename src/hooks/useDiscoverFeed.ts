import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DiscoverFeedItem {
  content_id: string;
  content_type: 'video' | 'track' | 'spotlight';
  title: string;
  media_url: string;
  cover_url: string | null;
  caption: string | null;
  artist_id: string;
  artist_name: string;
  artist_avatar: string | null;
  artist_user_id: string;
  genre: string | null;
  score: number;
  spotlight_entry_id: string | null;
  spotlight_campaign_id: string | null;
  created_at: string;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
let feedCache: { data: DiscoverFeedItem[]; timestamp: number } | null = null;

export function useDiscoverFeed(limit = 10) {
  const { user } = useAuth();
  const [items, setItems] = useState<DiscoverFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchFeed = useCallback(async (reset = false) => {
    if (!user) return;

    const currentOffset = reset ? 0 : offset;

    // Check cache for initial load
    if (reset && feedCache && Date.now() - feedCache.timestamp < CACHE_TTL) {
      setItems(feedCache.data);
      setOffset(feedCache.data.length);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_for_you_feed', {
        _user_id: user.id,
        _limit: limit,
        _offset: currentOffset,
      });

      if (error) throw error;

      const newItems = (data || []) as DiscoverFeedItem[];
      
      if (reset) {
        setItems(newItems);
        setOffset(newItems.length);
        // Cache initial load
        feedCache = { data: newItems, timestamp: Date.now() };
      } else {
        setItems((prev) => [...prev, ...newItems]);
        setOffset((prev) => prev + newItems.length);
      }

      setHasMore(newItems.length === limit);
    } catch (error) {
      console.error('Error fetching discover feed:', error);
    } finally {
      setLoading(false);
    }
  }, [user, offset, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeed(false);
    }
  }, [loading, hasMore, fetchFeed]);

  const refresh = useCallback(() => {
    feedCache = null;
    setOffset(0);
    fetchFeed(true);
  }, [fetchFeed]);

  useEffect(() => {
    fetchFeed(true);
  }, [user]);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    refresh,
  };
}
