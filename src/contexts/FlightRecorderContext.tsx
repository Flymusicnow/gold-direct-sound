import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { maskMeta } from '@/lib/maskSensitive';
import { getErrorReason } from '@/lib/errorDecoder';
import type { Json } from '@/integrations/supabase/types';

type TelemetryStatus = 'start' | 'ok' | 'warn' | 'fail' | 'end' | 'skip';

interface TelemetryEvent {
  trace_id: string;
  flow: string;
  step: string;
  status: string;
  timestamp: string;
  duration_ms?: number;
  user_id?: string;
  session_id: string;
  location: string;
  meta?: Json;
  decoded_error?: string;
}

interface FlightRecorderContextType {
  startFlow: (flowName: string) => string;
  step: (stepName: string, status: TelemetryStatus, meta?: Record<string, unknown>) => void;
  endFlow: (status: TelemetryStatus, meta?: Record<string, unknown>) => void;
  getCurrentTraceId: () => string | null;
  getSessionId: () => string;
}

const FlightRecorderContext = createContext<FlightRecorderContextType | null>(null);

// Generate a unique ID
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get or create session ID
function getOrCreateSessionId(): string {
  const key = 'flymusic_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess_${generateId()}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export function FlightRecorderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const sessionId = useRef(getOrCreateSessionId());
  const currentTraceId = useRef<string | null>(null);
  const currentFlow = useRef<string | null>(null);
  const flowStartTime = useRef<number | null>(null);
  const stepStartTimes = useRef<Map<string, number>>(new Map());

  // Queue for batching events
  const eventQueue = useRef<TelemetryEvent[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  // Flush events to database
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    
    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      // Fire and forget - don't await in production for performance
      supabase.from('telemetry_events').insert(events).then(({ error }) => {
        if (error) {
          console.warn('[FlightRecorder] Failed to log events:', error.message);
        }
      });
    } catch (e) {
      // Never crash the app due to telemetry
      console.warn('[FlightRecorder] Error flushing events:', e);
    }
  }, []);

  // Schedule flush
  const scheduleFlush = useCallback(() => {
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }
    flushTimeout.current = setTimeout(flushEvents, 1000);
  }, [flushEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimeout.current) {
        clearTimeout(flushTimeout.current);
      }
      flushEvents();
    };
  }, [flushEvents]);

  // Log a single event
  const logEvent = useCallback((event: Omit<TelemetryEvent, 'timestamp' | 'session_id' | 'user_id'>) => {
    const maskedMeta = event.meta ? maskMeta(event.meta) : undefined;
    
    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      session_id: sessionId.current,
      user_id: user?.id,
      meta: maskedMeta as Json,
    };

    eventQueue.current.push(fullEvent);
    scheduleFlush();

    // Also log to console in development
    if (import.meta.env.DEV) {
      const icon = {
        start: '🚀',
        ok: '✅',
        warn: '⚠️',
        fail: '❌',
        end: '🏁',
        skip: '⏭️',
      }[event.status];
      console.log(`[FlightRecorder] ${icon} ${event.flow}:${event.step} (${event.status})`, event.meta || '');
    }
  }, [user?.id, scheduleFlush]);

  // Start a new flow
  const startFlow = useCallback((flowName: string): string => {
    const traceId = `trace_${generateId()}`;
    currentTraceId.current = traceId;
    currentFlow.current = flowName;
    flowStartTime.current = Date.now();
    stepStartTimes.current.clear();

    logEvent({
      trace_id: traceId,
      flow: flowName,
      step: 'flow_start',
      status: 'start',
      location: window.location.pathname,
    });

    return traceId;
  }, [logEvent]);

  // Log a step in the current flow
  const step = useCallback((stepName: string, status: TelemetryStatus, meta?: Record<string, unknown>) => {
    if (!currentTraceId.current || !currentFlow.current) {
      console.warn('[FlightRecorder] No active flow for step:', stepName);
      return;
    }

    let durationMs: number | undefined;
    
    // Calculate duration if this is completing a step
    if (status !== 'start' && stepStartTimes.current.has(stepName)) {
      durationMs = Date.now() - stepStartTimes.current.get(stepName)!;
      stepStartTimes.current.delete(stepName);
    }
    
    // Record start time for new step
    if (status === 'start') {
      stepStartTimes.current.set(stepName, Date.now());
    }

    // Decode error if present
    let decodedError: string | undefined;
    if (status === 'fail' && meta?.error) {
      decodedError = getErrorReason(meta.error, meta.statusCode as number | undefined);
    }

    logEvent({
      trace_id: currentTraceId.current,
      flow: currentFlow.current,
      step: stepName,
      status,
      duration_ms: durationMs,
      location: window.location.pathname,
      meta: meta as Json,
      decoded_error: decodedError,
    });
  }, [logEvent]);

  // End the current flow
  const endFlow = useCallback((status: TelemetryStatus, meta?: Record<string, unknown>) => {
    if (!currentTraceId.current || !currentFlow.current) {
      console.warn('[FlightRecorder] No active flow to end');
      return;
    }

    const durationMs = flowStartTime.current ? Date.now() - flowStartTime.current : undefined;

    // Decode error if present
    let decodedError: string | undefined;
    if (status === 'fail' && meta?.error) {
      decodedError = getErrorReason(meta.error, meta.statusCode as number | undefined);
    }

    logEvent({
      trace_id: currentTraceId.current,
      flow: currentFlow.current,
      step: 'flow_end',
      status,
      duration_ms: durationMs,
      location: window.location.pathname,
      meta: meta as Json,
      decoded_error: decodedError,
    });

    // Clear flow state
    currentTraceId.current = null;
    currentFlow.current = null;
    flowStartTime.current = null;
    stepStartTimes.current.clear();
  }, [logEvent]);

  // Get current trace ID for API headers
  const getCurrentTraceId = useCallback(() => currentTraceId.current, []);

  // Get session ID
  const getSessionId = useCallback(() => sessionId.current, []);

  return (
    <FlightRecorderContext.Provider
      value={{
        startFlow,
        step,
        endFlow,
        getCurrentTraceId,
        getSessionId,
      }}
    >
      {children}
    </FlightRecorderContext.Provider>
  );
}

export function useFlightRecorder(): FlightRecorderContextType {
  const context = useContext(FlightRecorderContext);
  if (!context) {
    // Return no-op functions if context not available
    return {
      startFlow: () => '',
      step: () => {},
      endFlow: () => {},
      getCurrentTraceId: () => null,
      getSessionId: () => '',
    };
  }
  return context;
}
