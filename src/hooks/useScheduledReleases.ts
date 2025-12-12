import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ScheduledRelease {
  id: string;
  type: 'track' | 'video';
  title: string;
  cover_url?: string;
  release_date: string;
  status: string;
  created_at: string;
}

export function useScheduledReleases(artistId?: string) {
  const [releases, setReleases] = useState<ScheduledRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReleases = async () => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch scheduled tracks
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title, cover_url, release_date, status, created_at')
        .eq('artist_id', artistId)
        .in('status', ['draft', 'scheduled'])
        .order('release_date', { ascending: true, nullsFirst: false });

      if (tracksError) throw tracksError;

      // Fetch scheduled videos
      const { data: videos, error: videosError } = await supabase
        .from('artist_video_posts')
        .select('id, caption, thumbnail_url, release_date, status, created_at')
        .eq('artist_id', artistId)
        .in('status', ['draft', 'scheduled'])
        .order('release_date', { ascending: true, nullsFirst: false });

      if (videosError) throw videosError;

      const formattedReleases: ScheduledRelease[] = [
        ...(tracks || []).map(t => ({
          id: t.id,
          type: 'track' as const,
          title: t.title,
          cover_url: t.cover_url,
          release_date: t.release_date,
          status: t.status || 'draft',
          created_at: t.created_at
        })),
        ...(videos || []).map(v => ({
          id: v.id,
          type: 'video' as const,
          title: v.caption || 'Video',
          cover_url: v.thumbnail_url,
          release_date: v.release_date,
          status: v.status || 'draft',
          created_at: v.created_at
        }))
      ].sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
      });

      setReleases(formattedReleases);
    } catch (error) {
      console.error('Error fetching scheduled releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReleaseDate = async (id: string, type: 'track' | 'video', releaseDate: Date) => {
    const table = type === 'track' ? 'tracks' : 'artist_video_posts';
    
    const { error } = await supabase
      .from(table)
      .update({ 
        release_date: releaseDate.toISOString(),
        status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    await fetchReleases();
    toast.success('Release date updated');
  };

  const cancelSchedule = async (id: string, type: 'track' | 'video') => {
    const table = type === 'track' ? 'tracks' : 'artist_video_posts';
    
    const { error } = await supabase
      .from(table)
      .update({ 
        release_date: null,
        status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    await fetchReleases();
    toast.success('Schedule cancelled - saved as draft');
  };

  const releaseNow = async (id: string, type: 'track' | 'video') => {
    const table = type === 'track' ? 'tracks' : 'artist_video_posts';
    
    const { error } = await supabase
      .from(table)
      .update({ 
        release_date: new Date().toISOString(),
        status: 'public',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    await fetchReleases();
    toast.success('Released! Your content is now public.');
  };

  const subscribeToRelease = async (contentId: string, contentType: 'track' | 'video') => {
    if (!user) {
      toast.error('Please sign in to get notified');
      return;
    }

    const { error } = await supabase
      .from('release_notifications')
      .insert([{
        user_id: user.id,
        content_type: contentType,
        content_id: contentId
      }]);

    if (error) {
      if (error.code === '23505') {
        toast.info('You\'re already subscribed to this release');
      } else {
        throw error;
      }
    } else {
      toast.success('You\'ll be notified when this releases!');
    }
  };

  const unsubscribeFromRelease = async (contentId: string, contentType: 'track' | 'video') => {
    if (!user) return;

    const { error } = await supabase
      .from('release_notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) throw error;
    toast.success('Unsubscribed from release notifications');
  };

  const isSubscribed = async (contentId: string, contentType: 'track' | 'video') => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('release_notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  };

  useEffect(() => {
    fetchReleases();
  }, [artistId]);

  return {
    releases,
    loading,
    updateReleaseDate,
    cancelSchedule,
    releaseNow,
    subscribeToRelease,
    unsubscribeFromRelease,
    isSubscribed,
    refetch: fetchReleases
  };
}
