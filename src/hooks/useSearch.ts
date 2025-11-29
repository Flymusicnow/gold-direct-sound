import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchArtist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
}

export interface SearchTrack {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  genre: string | null;
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
  isInActiveSpotlight?: boolean;
  spotlightEntryId?: string;
  spotlightCampaignId?: string;
}

export interface SearchVideo {
  id: string;
  video_url: string;
  caption: string | null;
  duration_seconds: number | null;
  view_count: number;
  created_at: string;
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

export interface SearchSpotlightEntry {
  id: string;
  title: string | null;
  description: string | null;
  cached_rank: number | null;
  total_votes: number;
  campaign_id: string;
  tracks: {
    id: string;
    title: string;
    cover_url: string | null;
    artist_profiles: {
      id: string;
      artist_name: string;
      avatar_url: string | null;
    };
  };
}

export interface SearchStack {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  trackCount?: number;
}

export interface SearchResults {
  artists: SearchArtist[];
  tracks: SearchTrack[];
  videos: SearchVideo[];
  spotlightEntries: SearchSpotlightEntry[];
  stacks: SearchStack[];
}

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({
    artists: [],
    tracks: [],
    videos: [],
    spotlightEntries: [],
    stacks: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({
        artists: [],
        tracks: [],
        videos: [],
        spotlightEntries: [],
        stacks: [],
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const trimmedQuery = searchQuery.trim();

      // Parallel queries
      const [artistsRes, tracksRes, videosRes, spotlightRes, stacksRes] = await Promise.all([
        // Search artists
        supabase
          .from('artist_profiles')
          .select('*')
          .eq('status', 'approved')
          .or(`artist_name.ilike.%${trimmedQuery}%,genre.ilike.%${trimmedQuery}%`)
          .limit(20),

        // Search tracks
        supabase
          .from('tracks')
          .select(`
            id,
            title,
            description,
            audio_url,
            cover_url,
            genre,
            artist_profiles!inner (
              id,
              user_id,
              artist_name,
              avatar_url,
              status
            )
          `)
          .eq('artist_profiles.status', 'approved')
          .or(`title.ilike.%${trimmedQuery}%,genre.ilike.%${trimmedQuery}%`)
          .limit(20),

        // Search videos
        supabase
          .from('artist_video_posts')
          .select(`
            id,
            video_url,
            caption,
            duration_seconds,
            view_count,
            created_at,
            artist_profiles!inner (
              id,
              user_id,
              artist_name,
              avatar_url,
              status
            )
          `)
          .eq('artist_profiles.status', 'approved')
          .ilike('caption', `%${trimmedQuery}%`)
          .limit(20),

        // Search spotlight entries (active campaigns)
        supabase
          .from('spotlight_entries')
          .select(`
            id,
            title,
            description,
            cached_rank,
            total_votes,
            campaign_id,
            tracks!inner (
              id,
              title,
              cover_url,
              artist_profiles!inner (
                id,
                artist_name,
                avatar_url
              )
            ),
            spotlight_campaigns!inner (
              status
            )
          `)
          .eq('status', 'approved')
          .eq('spotlight_campaigns.status', 'active')
          .or(`tracks.title.ilike.%${trimmedQuery}%,tracks.artist_profiles.artist_name.ilike.%${trimmedQuery}%`)
          .limit(10),

        // Search public stacks
        supabase
          .from('playlists')
          .select('id, name, description, is_public, created_at')
          .eq('is_public', true)
          .ilike('name', `%${trimmedQuery}%`)
          .limit(10),
      ]);

      if (artistsRes.error) throw artistsRes.error;
      if (tracksRes.error) throw tracksRes.error;
      if (videosRes.error) throw videosRes.error;
      if (spotlightRes.error) throw spotlightRes.error;
      if (stacksRes.error) throw stacksRes.error;

      // Check which tracks are in active spotlight campaigns
      const trackIds = (tracksRes.data || []).map(t => t.id);
      const { data: spotlightTracks } = await supabase
        .from('spotlight_entries')
        .select('track_id, id, campaign_id, spotlight_campaigns!inner(status)')
        .eq('status', 'approved')
        .eq('spotlight_campaigns.status', 'active')
        .in('track_id', trackIds);

      const tracksWithSpotlight = (tracksRes.data || []).map(track => {
        const spotlightEntry = spotlightTracks?.find(se => se.track_id === track.id);
        return {
          ...track,
          isInActiveSpotlight: !!spotlightEntry,
          spotlightEntryId: spotlightEntry?.id,
          spotlightCampaignId: spotlightEntry?.campaign_id,
        };
      });

      setResults({
        artists: artistsRes.data || [],
        tracks: tracksWithSpotlight,
        videos: videosRes.data || [],
        spotlightEntries: spotlightRes.data || [],
        stacks: stacksRes.data || [],
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search');
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    totalResults:
      results.artists.length +
      results.tracks.length +
      results.videos.length +
      results.spotlightEntries.length +
      results.stacks.length,
  };
}
