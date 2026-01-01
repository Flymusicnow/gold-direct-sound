import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InviteAccessResult {
  hasInviteAccess: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  clearAccess: () => void;
}

type InviteRole = 'fan' | 'artist';

const getStorageKeys = (role: InviteRole) => ({
  tokenKey: role === 'artist' ? 'artist_invite_token' : 'fan_invite_token',
  expiresKey: role === 'artist' ? 'artist_invite_expires' : 'fan_invite_expires',
});

/**
 * Unified role-aware invite access hook.
 * Checks the appropriate localStorage keys based on role and validates against backend.
 */
export function useInviteAccess(role: InviteRole): InviteAccessResult {
  const [hasInviteAccess, setHasInviteAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { tokenKey, expiresKey } = getStorageKeys(role);

  useEffect(() => {
    validateAccess();
  }, [role]);

  const validateAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem(tokenKey);
      const storedExpires = localStorage.getItem(expiresKey);

      if (!storedToken) {
        setHasInviteAccess(false);
        setLoading(false);
        return;
      }

      // Check local expiry first (fast fail)
      if (storedExpires) {
        const expiresAt = new Date(storedExpires);
        if (expiresAt < new Date()) {
          clearAccess();
          setHasInviteAccess(false);
          setLoading(false);
          return;
        }
      }

      // Re-validate with backend - use fan_invite_sessions table (shared for both roles)
      const { data, error: queryError } = await supabase
        .from('fan_invite_sessions')
        .select('id, token, expires_at, used_at')
        .eq('token', storedToken)
        .maybeSingle();

      if (queryError) {
        console.error(`Error validating ${role} invite token:`, queryError);
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
      console.error(`Error in useInviteAccess (${role}):`, err);
      setError('Failed to check access');
      setHasInviteAccess(false);
      setLoading(false);
    }
  };

  const clearAccess = () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(expiresKey);
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

// Helper to store invite token after successful validation (role-aware)
export function storeInviteToken(role: InviteRole, token: string, expiresAt: string) {
  const { tokenKey, expiresKey } = getStorageKeys(role);
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(expiresKey, expiresAt);
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

    // Clear both fan and artist localStorage (we don't know which was used)
    localStorage.removeItem('fan_invite_token');
    localStorage.removeItem('fan_invite_expires');
    localStorage.removeItem('artist_invite_token');
    localStorage.removeItem('artist_invite_expires');
    return true;
  } catch (err) {
    console.error('Error consuming invite token:', err);
    return false;
  }
}
