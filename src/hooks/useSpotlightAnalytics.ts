import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SESSION_KEY = 'flymusic_spotlight_session';

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function useSpotlightAnalytics() {
  const { user } = useAuth();
  const viewStartTimes = useRef<Map<string, number>>(new Map());
  const trackedViews = useRef<Set<string>>(new Set());

  const trackView = useCallback(async (
    spotlightMediaId: string, 
    artistId: string,
    source?: string
  ) => {
    // Prevent duplicate tracking in same session
    const viewKey = `${spotlightMediaId}-${getSessionId()}`;
    if (trackedViews.current.has(viewKey)) return;
    
    trackedViews.current.add(viewKey);
    viewStartTimes.current.set(spotlightMediaId, Date.now());

    try {
      await supabase.from('spotlight_views').insert({
        spotlight_media_id: spotlightMediaId,
        artist_id: artistId,
        user_id: user?.id || null,
        session_id: getSessionId(),
        source: source || 'organic',
        referrer_url: document.referrer || null,
      });
    } catch (error) {
      console.error('Error tracking spotlight view:', error);
    }
  }, [user?.id]);

  const trackViewDuration = useCallback(async (spotlightMediaId: string) => {
    const startTime = viewStartTimes.current.get(spotlightMediaId);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    viewStartTimes.current.delete(spotlightMediaId);

    try {
      await supabase
        .from('spotlight_views')
        .update({ view_duration_ms: duration })
        .eq('spotlight_media_id', spotlightMediaId)
        .eq('session_id', getSessionId());
    } catch (error) {
      console.error('Error updating view duration:', error);
    }
  }, []);

  const trackLinkClick = useCallback(async (
    spotlightMediaId: string, 
    linkType: 'internal' | 'external'
  ) => {
    try {
      await supabase
        .from('spotlight_views')
        .update({ 
          clicked_link: true, 
          link_type: linkType 
        })
        .eq('spotlight_media_id', spotlightMediaId)
        .eq('session_id', getSessionId());
    } catch (error) {
      console.error('Error tracking link click:', error);
    }
  }, []);

  return { 
    trackView, 
    trackViewDuration,
    trackLinkClick,
    getSessionId 
  };
}
