import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface InboundParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  fm_ref?: string;
  fm_content?: string;
}

const SESSION_KEY = 'flymusic_inbound_session';

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function useInboundTracking(artistId: string | undefined) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!artistId || hasTracked.current) return;

    const params: InboundParams = {
      utm_source: searchParams.get('utm_source') || undefined,
      utm_medium: searchParams.get('utm_medium') || undefined,
      utm_campaign: searchParams.get('utm_campaign') || undefined,
      utm_content: searchParams.get('utm_content') || undefined,
      fm_ref: searchParams.get('fm_ref') || undefined,
      fm_content: searchParams.get('fm_content') || undefined,
    };

    // Only track if we have utm_source (came from external platform)
    if (params.utm_source) {
      hasTracked.current = true;
      trackInbound(artistId, params, user?.id);
      
      // Store context for conversion tracking
      sessionStorage.setItem('flymusic_inbound_context', JSON.stringify({
        artist_id: artistId,
        session_id: getSessionId(),
        timestamp: Date.now()
      }));
    }
  }, [artistId, searchParams, user?.id]);

  return { 
    hasExternalReferrer: !!searchParams.get('utm_source'),
    getSessionId 
  };
}

async function trackInbound(
  artistId: string, 
  params: InboundParams, 
  userId?: string
) {
  try {
    await supabase.from('inbound_tracking').insert({
      artist_id: artistId,
      source_platform: params.utm_source || 'unknown',
      campaign_name: params.utm_campaign || null,
      landing_type: params.fm_ref || 'profile',
      landing_id: params.fm_content || null,
      utm_source: params.utm_source || null,
      utm_medium: params.utm_medium || null,
      utm_campaign: params.utm_campaign || null,
      utm_content: params.utm_content || null,
      referrer_url: document.referrer || null,
      user_agent: navigator.userAgent,
      user_id: userId || null,
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error('Error tracking inbound:', error);
  }
}

// Helper to track conversions (follow, support actions)
export async function trackInboundConversion(conversionType: 'follow' | 'support') {
  const contextStr = sessionStorage.getItem('flymusic_inbound_context');
  if (!contextStr) return;

  try {
    const context = JSON.parse(contextStr);
    const updateField = conversionType === 'follow' 
      ? { converted_to_follow: true }
      : { converted_to_support: true };

    await supabase
      .from('inbound_tracking')
      .update(updateField)
      .eq('artist_id', context.artist_id)
      .eq('session_id', context.session_id);

    // Clear context after conversion
    sessionStorage.removeItem('flymusic_inbound_context');
  } catch (error) {
    console.error('Error tracking inbound conversion:', error);
  }
}
