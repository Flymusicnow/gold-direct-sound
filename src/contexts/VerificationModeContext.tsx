import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type VerificationStatus = 'idle' | 'pending' | 'passed' | 'failed';

interface VerificationError {
  type: 'runtime' | 'network' | 'route';
  message: string;
  timestamp: number;
}

interface VerificationModeContextType {
  isVerificationMode: boolean;
  issueId: string | null;
  verificationStatus: VerificationStatus;
  dwellTime: number;
  errors: VerificationError[];
  verifyIssue: () => Promise<boolean>;
  cancelVerification: () => void;
}

const VerificationModeContext = createContext<VerificationModeContextType | null>(null);

const VERIFICATION_DWELL_TIME = 10; // seconds

export const VerificationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isVerificationMode, setIsVerificationMode] = useState(false);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [dwellTime, setDwellTime] = useState(0);
  const [errors, setErrors] = useState<VerificationError[]>([]);
  
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorListenerRef = useRef<((event: ErrorEvent) => void) | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Check for verification mode params
  useEffect(() => {
    const verifyParam = searchParams.get('__verify');
    const issueParam = searchParams.get('__issue');
    
    if (verifyParam === '1' && issueParam) {
      setIsVerificationMode(true);
      setIssueId(issueParam);
      setVerificationStatus('pending');
      setDwellTime(0);
      setErrors([]);
      startTimeRef.current = Date.now();
      
      // Start dwell timer
      dwellTimerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDwellTime(elapsed);
        }
      }, 1000);
      
      // Set up error listener
      const errorHandler = (event: ErrorEvent) => {
        setErrors(prev => [...prev, {
          type: 'runtime',
          message: event.message || 'Unknown error',
          timestamp: Date.now()
        }]);
        setVerificationStatus('failed');
      };
      
      window.addEventListener('error', errorHandler);
      errorListenerRef.current = errorHandler;
      
      // Set up unhandled rejection listener
      const rejectionHandler = (event: PromiseRejectionEvent) => {
        setErrors(prev => [...prev, {
          type: 'runtime',
          message: event.reason?.message || 'Unhandled promise rejection',
          timestamp: Date.now()
        }]);
        setVerificationStatus('failed');
      };
      
      window.addEventListener('unhandledrejection', rejectionHandler);
      
      return () => {
        window.removeEventListener('error', errorHandler);
        window.removeEventListener('unhandledrejection', rejectionHandler);
      };
    } else {
      setIsVerificationMode(false);
      setIssueId(null);
      setVerificationStatus('idle');
      setDwellTime(0);
      setErrors([]);
      startTimeRef.current = null;
    }
    
    return () => {
      if (dwellTimerRef.current) {
        clearInterval(dwellTimerRef.current);
      }
    };
  }, [searchParams]);

  // Auto-verify after dwell time if no errors
  useEffect(() => {
    if (
      isVerificationMode && 
      verificationStatus === 'pending' && 
      dwellTime >= VERIFICATION_DWELL_TIME && 
      errors.length === 0
    ) {
      setVerificationStatus('passed');
      // Auto-trigger verification
      verifyIssue();
    }
  }, [dwellTime, isVerificationMode, verificationStatus, errors.length]);

  const verifyIssue = useCallback(async (): Promise<boolean> => {
    if (!issueId || !user) return false;
    
    try {
      const deviceType = window.innerWidth < 768 ? 'mobile' : 
                         window.innerWidth < 1024 ? 'tablet' : 'desktop';
      
      const { error } = await supabase
        .from('inbox_messages')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          verified_route: location.pathname,
          verified_device: deviceType,
        })
        .eq('id', issueId);
      
      if (error) {
        console.error('Failed to verify issue:', error);
        return false;
      }
      
      // Add verification update to timeline
      await supabase.from('inbox_updates').insert({
        message_id: issueId,
        author_id: user.id,
        update_text: `✓ Verified on ${location.pathname} (${deviceType})`,
        is_system: true,
        language: 'en',
      });
      
      // Clean up URL and redirect after short delay
      setTimeout(() => {
        // Remove verification params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('__verify');
        newParams.delete('__issue');
        
        // Navigate back to inbox
        navigate('/admin/inbox');
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Verification error:', err);
      return false;
    }
  }, [issueId, user, location.pathname, searchParams, navigate]);

  const cancelVerification = useCallback(() => {
    // Remove verification params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('__verify');
    newParams.delete('__issue');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return (
    <VerificationModeContext.Provider
      value={{
        isVerificationMode,
        issueId,
        verificationStatus,
        dwellTime,
        errors,
        verifyIssue,
        cancelVerification,
      }}
    >
      {children}
    </VerificationModeContext.Provider>
  );
};

export const useVerificationMode = (): VerificationModeContextType => {
  const context = useContext(VerificationModeContext);
  if (!context) {
    return {
      isVerificationMode: false,
      issueId: null,
      verificationStatus: 'idle',
      dwellTime: 0,
      errors: [],
      verifyIssue: async () => false,
      cancelVerification: () => {},
    };
  }
  return context;
};
