import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventType =
  | 'session_start'
  | 'session_end'
  | 'play'
  | 'skip'
  | 'complete'
  | 'save'
  | 'follow'
  | 'vote'
  | 'search';

interface TrackEventOptions {
  trackId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// Standalone fire-and-forget function (no hook needed)
export async function trackEventDirect(
  eventType: EventType,
  options: TrackEventOptions = {}
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`;
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        event_type: eventType,
        track_id: options.trackId || null,
        session_id: options.sessionId || null,
        metadata: options.metadata || {},
      }),
    }).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[EventTracker] Failed to send event:', eventType, err);
      }
    });
  } catch {
    // Never crash the app
  }
}

// Hook version for components
export function useEventTracker() {
  const trackEvent = useCallback(
    (eventType: EventType, options: TrackEventOptions = {}) => {
      trackEventDirect(eventType, options);
    },
    []
  );

  return { trackEvent };
}
