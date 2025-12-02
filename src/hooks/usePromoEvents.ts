import { supabase } from '@/integrations/supabase/client';

type PromoEventType = 
  | 'view' 
  | 'preview_50' 
  | 'follow_click' 
  | 'follow_success'
  | 'support_click' 
  | 'support_success' 
  | 'spotlight_vote' 
  | 'external_link';

interface PromoContext {
  promo_link_id: string;
  artist_id: string;
  content_id: string | null;
  content_type: string;
  slug: string;
  utm_source: string | null;
  timestamp: number;
}

// Throttle tracking: prevent spam from same session
const THROTTLE_WINDOW_MS = 30000; // 30 seconds
const eventThrottleMap = new Map<string, number>();

// Event sequence validation: preview_50 requires view first
const eventSequenceMap = new Map<string, Set<PromoEventType>>();

function getThrottleKey(promoId: string, eventType: PromoEventType, userId?: string): string {
  return `${promoId}:${eventType}:${userId || 'anon'}`;
}

function isThrottled(promoId: string, eventType: PromoEventType, userId?: string): boolean {
  // Only throttle view and preview_50 events
  if (eventType !== 'view' && eventType !== 'preview_50') return false;
  
  const key = getThrottleKey(promoId, eventType, userId);
  const lastTime = eventThrottleMap.get(key);
  
  if (lastTime && Date.now() - lastTime < THROTTLE_WINDOW_MS) {
    return true;
  }
  return false;
}

function recordThrottle(promoId: string, eventType: PromoEventType, userId?: string): void {
  const key = getThrottleKey(promoId, eventType, userId);
  eventThrottleMap.set(key, Date.now());
}

function validateEventSequence(promoId: string, eventType: PromoEventType, userId?: string): boolean {
  const key = `${promoId}:${userId || 'anon'}`;
  const recordedEvents = eventSequenceMap.get(key) || new Set();
  
  // preview_50 requires view to have been tracked first
  if (eventType === 'preview_50' && !recordedEvents.has('view')) {
    return false;
  }
  
  // follow_success requires follow_click
  if (eventType === 'follow_success' && !recordedEvents.has('follow_click')) {
    return false;
  }
  
  // support_success requires support_click
  if (eventType === 'support_success' && !recordedEvents.has('support_click')) {
    return false;
  }
  
  return true;
}

function recordEventSequence(promoId: string, eventType: PromoEventType, userId?: string): void {
  const key = `${promoId}:${userId || 'anon'}`;
  const recordedEvents = eventSequenceMap.get(key) || new Set();
  recordedEvents.add(eventType);
  eventSequenceMap.set(key, recordedEvents);
}

export function usePromoEvents() {
  const trackPromoEvent = async (
    promoId: string,
    artistId: string,
    eventType: PromoEventType,
    userId?: string,
    utmSource?: string
  ): Promise<boolean> => {
    try {
      // Anti-fraud: Check throttling
      if (isThrottled(promoId, eventType, userId)) {
        console.log(`[PromoEvents] Throttled: ${eventType} for ${promoId}`);
        return false;
      }
      
      // Anti-fraud: Validate event sequence
      if (!validateEventSequence(promoId, eventType, userId)) {
        console.log(`[PromoEvents] Invalid sequence: ${eventType} for ${promoId}`);
        return false;
      }
      
      await supabase.from('promo_events').insert({
        promo_id: promoId,
        artist_id: artistId,
        user_id: userId || null,
        event_type: eventType,
        utm_source: utmSource || null,
        ip_hash: null, // Would be set server-side for security
        user_agent: navigator.userAgent,
      });

      // Record throttle and sequence
      recordThrottle(promoId, eventType, userId);
      recordEventSequence(promoId, eventType, userId);

      // If it's a view event, also increment click count
      if (eventType === 'view') {
        await supabase.rpc('increment_promo_click', { _promo_id: promoId });
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking promo event:', error);
      return false;
    }
  };

  const setPromoContext = (promoLink: {
    id: string;
    artist_id: string;
    content_id: string | null;
    content_type: string;
    slug: string;
    utm_source: string | null;
  }) => {
    const context: PromoContext = {
      promo_link_id: promoLink.id,
      artist_id: promoLink.artist_id,
      content_id: promoLink.content_id,
      content_type: promoLink.content_type,
      slug: promoLink.slug,
      utm_source: promoLink.utm_source,
      timestamp: Date.now(),
    };
    localStorage.setItem('flymusic_promo', JSON.stringify(context));
  };

  const getPromoContext = (): PromoContext | null => {
    const stored = localStorage.getItem('flymusic_promo');
    if (!stored) return null;
    
    try {
      const context = JSON.parse(stored) as PromoContext;
      // Check if context is less than 24 hours old
      if (Date.now() - context.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('flymusic_promo');
        return null;
      }
      return context;
    } catch {
      return null;
    }
  };

  const clearPromoContext = () => {
    localStorage.removeItem('flymusic_promo');
  };

  return {
    trackPromoEvent,
    setPromoContext,
    getPromoContext,
    clearPromoContext,
  };
}
