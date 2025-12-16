import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { InboxLanguage, getInboxTranslation } from '@/i18n/inbox';

export interface AIContext {
  route: string;
  user_role: string;
  user_id: string;
  device: 'mobile' | 'desktop';
  browser: string;
  user_note?: string;
  user_note_lang?: InboxLanguage;
  recent_errors: Array<{
    message: string;
    route: string | null;
    timestamp: string;
  }>;
  timestamp: string;
}

export function useContextualReport() {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUserRole = (): string => {
    if (hasRole('admin')) return 'admin';
    if (hasRole('artist')) return 'artist';
    if (hasRole('brand')) return 'brand';
    if (hasRole('fan')) return 'fan';
    return 'unknown';
  };

  const collectContext = async (userNote?: string, language?: InboxLanguage): Promise<AIContext> => {
    // Fetch recent errors for this route
    let recentErrors: AIContext['recent_errors'] = [];
    
    try {
      const { data: errors } = await supabase
        .from('runtime_errors')
        .select('error_message, route, created_at')
        .eq('route', location.pathname)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (errors) {
        recentErrors = errors.map(e => ({
          message: e.error_message || 'Unknown error',
          route: e.route,
          timestamp: e.created_at
        }));
      }
    } catch (err) {
      console.error('Failed to fetch recent errors:', err);
    }

    return {
      route: location.pathname,
      user_role: getUserRole(),
      user_id: user?.id || 'anonymous',
      device: isMobile ? 'mobile' : 'desktop',
      browser: navigator.userAgent,
      user_note: userNote || undefined,
      user_note_lang: userNote ? language : undefined,
      recent_errors: recentErrors,
      timestamp: new Date().toISOString()
    };
  };

  const submitReport = async (userNote: string, language: InboxLanguage = 'en'): Promise<boolean> => {
    if (!user) return false;
    
    setIsSubmitting(true);
    
    try {
      const aiContext = await collectContext(userNote, language);
      
      // Generate dedupe key: max 1 report per route per user per day
      const today = new Date().toISOString().split('T')[0];
      const dedupeKey = `contextual_report:${location.pathname}:${user.id}:${today}`;
      
      // Determine priority based on recent errors
      const priority = aiContext.recent_errors.length > 0 ? 'high' : 'normal';
      
      // Create summary from user note or default (in English for consistency)
      const summary = userNote 
        ? `${getUserRole()} user reported: "${userNote.slice(0, 100)}${userNote.length > 100 ? '...' : ''}"`
        : `${getUserRole()} user reported issue on ${isMobile ? 'mobile' : 'desktop'}`;

      // Title in selected language
      const title = `${getInboxTranslation(language, 'issueReportedFrom')} ${location.pathname}`;

      const { error } = await supabase.rpc('upsert_inbox_message', {
        _dedupe_key: dedupeKey,
        _title: title,
        _type: 'contextual_report',
        _summary: summary,
        _priority: priority,
        _payload: JSON.parse(JSON.stringify({ 
          ai_context: aiContext,
          title_key: 'issueReportedFrom',
          title_data: { route: location.pathname }
        }))
      });

      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Failed to submit contextual report:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReport,
    isSubmitting,
    currentRoute: location.pathname
  };
}
