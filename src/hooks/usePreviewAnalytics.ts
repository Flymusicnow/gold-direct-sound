import { useFlightRecorder } from '@/contexts/FlightRecorderContext';
import { usePreviewMode } from './usePreviewMode';
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for tracking preview mode interactions and conversions
 * 
 * Tracks:
 * - preview_session: page_view, cta_click, convert_attempt
 * - preview_conversion: dialog_open, form_submit, success
 */
export function usePreviewAnalytics(pageName: string) {
  const { startFlow, step, endFlow } = useFlightRecorder();
  const { isPreviewMode, loading } = usePreviewMode();
  const hasTrackedPageView = useRef(false);
  const flowStarted = useRef(false);

  // Track page view in preview mode (once per page)
  useEffect(() => {
    if (!loading && isPreviewMode && !hasTrackedPageView.current) {
      startFlow('preview_session');
      step('page_view', 'ok', { page: pageName, timestamp: new Date().toISOString() });
      hasTrackedPageView.current = true;
      flowStarted.current = true;
    }
  }, [isPreviewMode, loading, pageName, startFlow, step]);

  // Track CTA clicks (Sign In or Request Access)
  const trackCTAClick = useCallback((ctaType: 'sign_in' | 'request_access') => {
    if (flowStarted.current) {
      step('cta_click', 'ok', { 
        cta_type: ctaType, 
        page: pageName,
        timestamp: new Date().toISOString()
      });
    }
  }, [pageName, step]);

  // Track conversion attempt (opening beta dialog or navigating to signup)
  const trackConversionAttempt = useCallback(() => {
    if (flowStarted.current) {
      step('convert_attempt', 'ok', { 
        page: pageName,
        timestamp: new Date().toISOString()
      });
      endFlow('ok', { converted: true, page: pageName });
      flowStarted.current = false;
    }
  }, [pageName, step, endFlow]);

  // Track when user just views without converting
  const trackSessionEnd = useCallback(() => {
    if (flowStarted.current) {
      endFlow('ok', { converted: false, page: pageName });
      flowStarted.current = false;
    }
  }, [pageName, endFlow]);

  return { 
    trackCTAClick, 
    trackConversionAttempt,
    trackSessionEnd,
    isPreviewMode 
  };
}
