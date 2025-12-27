import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FanInviteAccessResult {
  hasInviteAccess: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  clearAccess: () => void;
}

const STORAGE_KEY = 'fan_invite_token';
const EXPIRES_KEY = 'fan_invite_expires';

export function useFanInviteAccess(): FanInviteAccessResult {
  const [hasInviteAccess, setHasInviteAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    validateAccess();
  }, []);

  const validateAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage (fallback when cookies blocked)
      const storedToken = localStorage.getItem(STORAGE_KEY);
      const storedExpires = localStorage.getItem(EXPIRES_KEY);

      if (!storedToken) {
        setHasInviteAccess(false);
        setLoading(false);
        return;
      }

      // Check local expiry first (fast fail)
      if (storedExpires) {
        const expiresAt = new Date(storedExpires);
        if (expiresAt < new Date()) {
          // Token expired locally - clear and deny
          clearAccess();
          setHasInviteAccess(false);
          setLoading(false);
          return;
        }
      }

      // Re-validate with backend (source of truth)
      const { data, error: queryError } = await supabase
        .from('fan_invite_sessions')
        .select('id, token, expires_at, used_at')
        .eq('token', storedToken)
        .maybeSingle();

      if (queryError) {
        console.error('Error validating invite token:', queryError);
        setError('Failed to validate access');
        setHasInviteAccess(false);
        setLoading(false);
        return;
      }

      if (!data) {
        // Token not found in database
        clearAccess();
        setHasInviteAccess(false);
        setLoading(false);
        return;
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        clearAccess();
        setHasInviteAccess(false);
        setLoading(false);
        return;
      }

      // Check if token was already used (signup completed)
      if (data.used_at) {
        clearAccess();
        setHasInviteAccess(false);
        setLoading(false);
        return;
      }

      // Token is valid
      setToken(storedToken);
      setHasInviteAccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error in useFanInviteAccess:', err);
      setError('Failed to check access');
      setHasInviteAccess(false);
      setLoading(false);
    }
  };

  const clearAccess = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    setToken(null);
    setHasInviteAccess(false);
  };

  return {
    hasInviteAccess,
    loading,
    error,
    token,
    clearAccess
  };
}

// Helper to store invite token after successful validation
export function storeInviteToken(token: string, expiresAt: string) {
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(EXPIRES_KEY, expiresAt);
}

// Helper to mark token as used after signup
export async function consumeInviteToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('fan_invite_sessions')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (error) {
      console.error('Error consuming invite token:', error);
      return false;
    }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return true;
  } catch (err) {
    console.error('Error consuming invite token:', err);
    return false;
  }
}
