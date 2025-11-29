import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Music2, Mic2, Sparkles } from 'lucide-react';

interface TrendingItem {
  id: string;
  name: string;
  type: 'track' | 'artist' | 'spotlight';
  value: number;
}

interface TrendingSearchesProps {
  onItemClick: (query: string) => void;
}

export function TrendingSearches({ onItemClick }: TrendingSearchesProps) {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);

      // Get top 3 played tracks
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, title, play_count, artist_profiles!inner(status)')
        .eq('artist_profiles.status', 'approved')
        .order('play_count', { ascending: false })
        .limit(3);

      // Get top 3 followed artists
      const { data: artists } = await supabase
        .from('artist_profiles')
        .select('id, artist_name')
        .eq('status', 'approved')
        .limit(3);

      // Get follower counts for artists
      const artistsWithFollowers = await Promise.all(
        (artists || []).map(async (artist) => {
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artist.id);
          return { ...artist, follower_count: count || 0 };
        })
      );
      const sortedArtists = artistsWithFollowers.sort((a, b) => b.follower_count - a.follower_count);

      // Get top 3 rising spotlight entries
      const { data: spotlight } = await supabase
        .from('spotlight_entries')
        .select(`
          id,
          total_votes,
          tracks!inner(title),
          spotlight_campaigns!inner(status)
        `)
        .eq('status', 'approved')
        .eq('spotlight_campaigns.status', 'active')
        .order('total_votes', { ascending: false })
        .limit(3);

      const allTrending: TrendingItem[] = [
        ...(tracks || []).map(t => ({
          id: t.id,
          name: t.title,
          type: 'track' as const,
          value: t.play_count || 0,
        })),
        ...sortedArtists.slice(0, 3).map(a => ({
          id: a.id,
          name: a.artist_name,
          type: 'artist' as const,
          value: a.follower_count,
        })),
        ...(spotlight || []).map(s => ({
          id: s.id,
          name: s.tracks.title,
          type: 'spotlight' as const,
          value: s.total_votes || 0,
        })),
      ];

      setTrending(allTrending);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading trending...</p>
      </div>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Trending This Week</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {trending.map((item) => {
          const Icon = item.type === 'track' ? Music2 : item.type === 'artist' ? Mic2 : Sparkles;
          return (
            <Badge
              key={`${item.type}-${item.id}`}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors text-sm py-2 px-3"
              onClick={() => onItemClick(item.name)}
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {item.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {item.value.toLocaleString()}
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
