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

export function usePromoEvents() {
  const trackPromoEvent = async (
    promoId: string,
    artistId: string,
    eventType: PromoEventType,
    userId?: string,
    utmSource?: string
  ) => {
    try {
      await supabase.from('promo_events').insert({
        promo_id: promoId,
        artist_id: artistId,
        user_id: userId || null,
        event_type: eventType,
        utm_source: utmSource || null,
        ip_hash: null, // Would be set server-side for security
        user_agent: navigator.userAgent,
      });

      // If it's a view event, also increment click count
      if (eventType === 'view') {
        await supabase.rpc('increment_promo_click', { _promo_id: promoId });
      }
    } catch (error) {
      console.error('Error tracking promo event:', error);
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
