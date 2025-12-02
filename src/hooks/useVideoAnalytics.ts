import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupportScore } from './useSupportScore';

interface UseVideoAnalyticsProps {
  videoId: string;
  duration?: number;
}

interface WatchSegment {
  start: number;
  end: number;
  watched_at: string;
}

export const useVideoAnalytics = ({ videoId, duration }: UseVideoAnalyticsProps) => {
  const [viewId, setViewId] = useState<string | null>(null);
  const { updateSupportScore } = useSupportScore();
  const startTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const watchSegmentsRef = useRef<WatchSegment[]>([]);
  const lastSegmentTimeRef = useRef<number>(0);
  const hasAwardedXPRef = useRef<boolean>(false);
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

      // View count is now automatically incremented by database trigger
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const updateWatchDuration = async (currentTime: number, userId?: string, artistId?: string) => {
    if (!viewId) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 5000) return; // Update every 5 seconds max

    try {
      // Record watch segment
      const segmentStart = lastSegmentTimeRef.current;
      const segmentEnd = currentTime;
      
      if (segmentEnd > segmentStart) {
        watchSegmentsRef.current.push({
          start: Math.floor(segmentStart),
          end: Math.floor(segmentEnd),
          watched_at: new Date().toISOString(),
        });
      }
      
      lastSegmentTimeRef.current = currentTime;

      const watchDuration = Math.floor((now - startTimeRef.current) / 1000);
      const completed = duration ? currentTime >= duration * 0.5 : false; // 50% completion threshold

      await supabase
        .from('video_views')
        .update({
          watch_duration_seconds: watchDuration,
          completed,
          watch_segments: watchSegmentsRef.current as any,
        })
        .eq('id', viewId);

      // Taste Engine V1.5: Update taste profile on video watch completion (>50%)
      if (completed && userId && artistId && !hasAwardedXPRef.current) {
        hasAwardedXPRef.current = true;
        
        // Fire-and-forget taste update
        supabase.rpc('update_taste_profile', {
          _fan_user_id: userId,
          _artist_id: artistId,
          _interaction: 'watch_video',
          _track_id: null,
          _video_id: videoId,
        }).then((result) => {
          if (result.error) {
            console.error('Error updating taste for video watch:', result.error);
          } else {
            console.log('Taste profile updated for video watch');
          }
        });

        // Award Supporter XP for video watch (watch_video action = +3 XP)
        updateSupportScore(artistId, 'watch_video', undefined, videoId)
          .catch(err => console.error('Error updating support score for video watch:', err));
      }

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
