import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RisingArtist {
  artist_id: string;
  artist_name: string;
  artist_avatar: string | null;
  artist_user_id: string;
  genre: string | null;
  follower_count: number;
  new_followers: number;
  new_likes: number;
  supporter_xp: number;
  rising_score: number;
  created_at: string;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
let risingCache: { data: RisingArtist[]; timestamp: number } | null = null;

export function useRisingArtists(days = 7, limit = 10) {
  const [artists, setArtists] = useState<RisingArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRising = useCallback(async () => {
    // Check cache
    if (risingCache && Date.now() - risingCache.timestamp < CACHE_TTL) {
      setArtists(risingCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_rising_artists', {
        _days: days,
        _limit: limit,
      });

      if (error) throw error;

      const newArtists = data || [];
      setArtists(newArtists);
      
      // Cache result
      risingCache = { data: newArtists, timestamp: Date.now() };
    } catch (error) {
      console.error('Error fetching rising artists:', error);
    } finally {
      setLoading(false);
    }
  }, [days, limit]);

  useEffect(() => {
    fetchRising();
  }, [fetchRising]);

  return {
    artists,
    loading,
    refresh: fetchRising,
  };
}
