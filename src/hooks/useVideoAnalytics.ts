import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVideoAnalyticsProps {
  videoId: string;
  duration?: number;
}

export const useVideoAnalytics = ({ videoId, duration }: UseVideoAnalyticsProps) => {
  const [viewId, setViewId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const sessionId = useRef<string>(
    sessionStorage.getItem('video_session_id') || crypto.randomUUID()
  );

  useEffect(() => {
    sessionStorage.setItem('video_session_id', sessionId.current);
  }, []);

  const trackView = async (userId?: string) => {
    try {
      // Check if already tracked this video in this session
      const sessionKey = `video_view_${videoId}_${sessionId.current}`;
      if (sessionStorage.getItem(sessionKey)) {
        return;
      }

      const { data, error } = await supabase
        .from('video_views')
        .insert({
          video_id: videoId,
          user_id: userId,
          session_id: sessionId.current,
        })
        .select()
        .single();

      if (error) throw error;

      setViewId(data.id);
      sessionStorage.setItem(sessionKey, 'true');
      startTimeRef.current = Date.now();

      // Increment view count on video
      const { data: currentVideo } = await supabase
        .from('artist_video_posts')
        .select('view_count')
        .eq('id', videoId)
        .single();

      await supabase
        .from('artist_video_posts')
        .update({ view_count: (currentVideo?.view_count || 0) + 1 })
        .eq('id', videoId);
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const updateWatchDuration = async (currentTime: number) => {
    if (!viewId) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 5000) return; // Update every 5 seconds max

    try {
      const watchDuration = Math.floor((now - startTimeRef.current) / 1000);
      const completed = duration ? currentTime >= duration * 0.9 : false;

      await supabase
        .from('video_views')
        .update({
          watch_duration_seconds: watchDuration,
          completed,
        })
        .eq('id', viewId);

      lastUpdateRef.current = now;
    } catch (error) {
      console.error('Error updating watch duration:', error);
    }
  };

  return {
    trackView,
    updateWatchDuration,
  };
};
