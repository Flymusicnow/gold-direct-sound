import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

interface ApiCall {
  id: string;
  timestamp: Date;
  category: string;
  message: string;
  data?: any;
  status?: 'pending' | 'success' | 'error';
}

interface ReproModeContextType {
  isReproMode: boolean;
  issueId: string | null;
  reproLog: (category: string, message: string, data?: any) => void;
  trackApiCall: (category: string, message: string, data?: any, status?: 'pending' | 'success' | 'error') => void;
  apiCalls: ApiCall[];
  errorCount: number;
  clearApiCalls: () => void;
}

const ReproModeContext = createContext<ReproModeContextType | undefined>(undefined);

export function ReproModeProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

  const isReproMode = searchParams.get('__repro') === '1';
  const issueId = searchParams.get('__issue');

  const errorCount = apiCalls.filter(call => call.status === 'error').length;

  // Log route changes in repro mode
  useEffect(() => {
    if (isReproMode) {
      console.log(`[REPRO] ROUTE_CHANGE: Navigated to ${location.pathname}`, {
        search: location.search,
        issueId,
      });
    }
  }, [location.pathname, location.search, isReproMode, issueId]);

  const reproLog = useCallback((category: string, message: string, data?: any) => {
    if (!isReproMode) return;
    
    const logMessage = `[REPRO] ${category}: ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }, [isReproMode]);

  const trackApiCall = useCallback((
    category: string, 
    message: string, 
    data?: any, 
    status: 'pending' | 'success' | 'error' = 'pending'
  ) => {
    if (!isReproMode) return;

    const call: ApiCall = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      category,
      message,
      data,
      status,
    };

    setApiCalls(prev => [...prev.slice(-49), call]); // Keep last 50 calls

    // Also log to console
    const statusIcon = status === 'error' ? '❌' : status === 'success' ? '✅' : '⏳';
    console.log(`[REPRO] ${statusIcon} ${category}: ${message}`, data || '');
  }, [isReproMode]);

  const clearApiCalls = useCallback(() => {
    setApiCalls([]);
  }, []);

  return (
    <ReproModeContext.Provider value={{
      isReproMode,
      issueId,
      reproLog,
      trackApiCall,
      apiCalls,
      errorCount,
      clearApiCalls,
    }}>
      {children}
    </ReproModeContext.Provider>
  );
}

export function useReproMode() {
  const context = useContext(ReproModeContext);
  if (context === undefined) {
    // Return no-op functions when used outside provider
    return {
      isReproMode: false,
      issueId: null,
      reproLog: () => {},
      trackApiCall: () => {},
      apiCalls: [],
      errorCount: 0,
      clearApiCalls: () => {},
    };
  }
  return context;
}
