import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GenreContentItem {
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
  created_at: string;
}

const genreCaches = new Map<string, { data: GenreContentItem[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export function useGenreContent(genre: string, limit = 10) {
  const [items, setItems] = useState<GenreContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGenreContent = useCallback(async () => {
    if (!genre) return;

    // Check cache
    const cached = genreCaches.get(genre);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setItems(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_genre_content', {
        _genre: genre,
        _limit: limit,
      });

      if (error) throw error;

      const newItems = (data || []) as GenreContentItem[];
      setItems(newItems);
      
      // Cache result
      genreCaches.set(genre, { data: newItems, timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching genre content:', error);
    } finally {
      setLoading(false);
    }
  }, [genre, limit]);

  useEffect(() => {
    fetchGenreContent();
  }, [fetchGenreContent]);

  return {
    items,
    loading,
    refresh: fetchGenreContent,
  };
}

// Hook to get unique genres
export function useGenres() {
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const { data, error } = await supabase
          .from('artist_profiles')
          .select('genre')
          .eq('status', 'approved')
          .not('genre', 'is', null);

        if (error) throw error;

        const uniqueGenres = [...new Set(data.map((item) => item.genre).filter(Boolean))];
        setGenres(uniqueGenres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  return { genres, loading };
}
