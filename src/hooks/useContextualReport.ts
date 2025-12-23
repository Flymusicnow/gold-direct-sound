import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouteHistory } from '@/contexts/RouteHistoryContext';
import { getRecentFailedRequests, NetworkError } from '@/lib/networkErrorTracker';
import { InboxLanguage, getInboxTranslation } from '@/i18n/inbox';
import type { Json } from '@/integrations/supabase/types';

export interface RecentError {
  type: 'runtime' | 'network';
  message: string;
  route: string | null;
  timestamp: string;
  // Network-specific fields
  method?: string;
  path?: string;
  status?: number;
}

export interface AIContext {
  report_id: string;
  route: string;
  target_route?: string;
  last_routes: string[];
  repro_steps?: string;
  user_role: string;
  user_id: string;
  device: 'mobile' | 'desktop';
  browser: string;
  user_note?: string;
  user_note_lang?: InboxLanguage;
  recent_errors: RecentError[];
  timestamp: string;
}

export interface Attachment {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export function useContextualReport() {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const isMobile = useIsMobile();
  const { lastRoutes } = useRouteHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(location.pathname);

  // Refresh route to current location - call this when dialog opens
  const refreshRoute = () => {
    setCurrentRoute(location.pathname);
  };

  const getUserRole = (): string => {
    if (hasRole('admin')) return 'admin';
    if (hasRole('artist')) return 'artist';
    if (hasRole('brand')) return 'brand';
    if (hasRole('fan')) return 'fan';
    return 'unknown';
  };

  const collectContext = async (
    userNote?: string, 
    language?: InboxLanguage,
    targetRoute?: string,
    reproSteps?: string
  ): Promise<AIContext> => {
    // Generate unique report ID
    const reportId = crypto.randomUUID();
    
    // Get recent runtime errors from database
    let runtimeErrors: RecentError[] = [];
    
    try {
      const { data: errors } = await supabase
        .from('runtime_errors')
        .select('error_message, route, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (errors) {
        runtimeErrors = errors.map(e => ({
          type: 'runtime' as const,
          message: e.error_message || 'Unknown error',
          route: e.route,
          timestamp: e.created_at
        }));
      }
    } catch (err) {
      console.error('[Report] Failed to fetch runtime errors:', err);
    }

    // Get recent network errors from memory
    const networkErrors: RecentError[] = getRecentFailedRequests().map((e: NetworkError) => ({
      type: 'network' as const,
      message: e.message,
      route: null,
      timestamp: e.timestamp,
      method: e.method,
      path: e.path,
      status: e.status,
    }));

    // Combine and sort by timestamp (most recent first)
    const recentErrors = [...runtimeErrors, ...networkErrors]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Log report ID for debugging
    console.log('[Report]', reportId);

    return {
      report_id: reportId,
      route: currentRoute,
      target_route: targetRoute && targetRoute !== currentRoute ? targetRoute : undefined,
      last_routes: lastRoutes.slice(0, 5),
      repro_steps: reproSteps || undefined,
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

  // Upload screenshots to storage
  const uploadScreenshots = async (inboxId: string, files: File[]): Promise<Attachment[]> => {
    const uploaded: Attachment[] = [];
    
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${inboxId}/${crypto.randomUUID()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('issue-screenshots')
        .upload(path, file, { upsert: false, contentType: file.type });
      
      if (uploadError) {
        console.error('[Report] Upload failed:', uploadError);
        continue; // Skip failed uploads, don't throw
      }
      
      const { data: publicData } = supabase.storage
        .from('issue-screenshots')
        .getPublicUrl(path);
      
      uploaded.push({
        url: publicData.publicUrl,
        path,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }
    
    return uploaded;
  };

  // Send Telegram notification (non-blocking)
  const sendTelegramNotification = async (payload: {
    inbox_id: string;
    title: string;
    route: string;
    user_role: string;
    user_note?: string;
    timestamp: string;
  }) => {
    console.log('[Telegram] Invoking edge function with payload:', JSON.stringify(payload, null, 2));
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: payload,
      });
      if (error) {
        console.error('[Telegram] Edge function error:', error);
        return;
      }
      console.log('[Telegram] Success - response:', data);
    } catch (err) {
      console.error('[Telegram] Network/invoke error:', err);
    }
  };

  // Validate files before upload
  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    if (files.length > MAX_FILES) {
      return { valid: false, error: 'tooManyFiles' };
    }
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'fileTooLarge' };
      }
      if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'invalidFileType' };
      }
    }
    
    return { valid: true };
  };

  const submitReport = async (
    userNote: string, 
    language: InboxLanguage = 'en',
    targetRoute?: string,
    reproSteps?: string,
    files?: File[]
  ): Promise<boolean> => {
    if (!user) return false;
    
    setIsSubmitting(true);
    
    try {
      // Validate files if provided
      if (files && files.length > 0) {
        const validation = validateFiles(files);
        if (!validation.valid) {
          console.error('[Report] File validation failed:', validation.error);
          return false;
        }
      }
      
      const aiContext = await collectContext(userNote, language, targetRoute, reproSteps);
      
      // Generate dedupe key: max 1 report per route per user per day
      const today = new Date().toISOString().split('T')[0];
      const dedupeKey = `contextual_report:${currentRoute}:${user.id}:${today}`;
      
      // Determine priority based on recent errors
      const priority = aiContext.recent_errors.length > 0 ? 'high' : 'normal';
      
      // Create summary from user note or default (in English for consistency)
      const summary = userNote 
        ? `${getUserRole()} user reported: "${userNote.slice(0, 100)}${userNote.length > 100 ? '...' : ''}"`
        : `${getUserRole()} user reported issue on ${isMobile ? 'mobile' : 'desktop'}`;

      // Title in selected language - use currentRoute for fresh value
      const title = `${getInboxTranslation(language, 'issueReportedFrom')} ${currentRoute}`;

      console.log('[Report] Calling upsert_inbox_message RPC with dedupeKey:', dedupeKey);
      
      const { data, error } = await supabase.rpc('upsert_inbox_message', {
        _dedupe_key: dedupeKey,
        _title: title,
        _type: 'contextual_report',
        _summary: summary,
        _priority: priority,
        _payload: JSON.parse(JSON.stringify({ 
          ai_context: aiContext,
          title_key: 'issueReportedFrom',
          title_data: { route: currentRoute }
        }))
      });

      console.log('[Report] RPC result - data:', data, 'error:', error);

      if (error) throw error;
      
      const inboxId = data || dedupeKey;
      
      // Upload screenshots if provided
      if (files && files.length > 0) {
        console.log('[Report] Uploading', files.length, 'screenshots for inbox:', inboxId);
        const attachments = await uploadScreenshots(inboxId, files);
        
        if (attachments.length > 0) {
          // Update inbox message with attachments (cast to JSON for Supabase)
          const { error: updateError } = await supabase
            .from('inbox_messages')
            .update({ attachments: JSON.parse(JSON.stringify(attachments)) as Json })
            .eq('id', inboxId);
          
          if (updateError) {
            console.error('[Report] Failed to update attachments:', updateError);
            // Don't fail the report, attachments are optional
          } else {
            console.log('[Report] Attachments updated successfully:', attachments.length);
          }
        }
      }
      
      // Send Telegram notification in background (non-blocking)
      console.log('[Report] Sending Telegram notification for inbox:', inboxId);
      
      sendTelegramNotification({
        inbox_id: inboxId,
        title: title,
        route: currentRoute,
        user_role: aiContext.user_role,
        user_note: userNote,
        timestamp: aiContext.timestamp,
      });
      
      return true;
    } catch (err) {
      console.error('[Report] Failed to submit contextual report:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReport,
    isSubmitting,
    currentRoute,
    refreshRoute,
    lastRoutes,
    validateFiles,
    MAX_FILES,
    MAX_FILE_SIZE,
  };
}