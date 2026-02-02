import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for fetching current user profile from GET /me endpoint.
 * 
 * Returns user data with resolved per-feature permissions.
 * Use hasPermission(featureKey) for access checks instead of level comparisons.
 * 
 * Example:
 *   const { hasPermission, getFeatureLabel } = useCurrentUser();
 *   if (hasPermission('advanced_analytics')) { ... }
 *   const label = getFeatureLabel('advanced_analytics'); // "Included in trial (MVP)"
 */
export const useCurrentUser = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    if (!user) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('get-me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      if (error) throw error;
      setCurrentUser(data);
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  /**
   * Check if user has permission for a specific feature.
   * Returns false if user not loaded or permission not found.
   */
  const hasPermission = useCallback((featureKey: string): boolean => {
    if (!currentUser?.permissions) return false;
    return currentUser.permissions[featureKey] === true;
  }, [currentUser?.permissions]);

  /**
   * Get the UI label for a feature (e.g., "Included in trial (MVP)").
   * Returns null if no label defined.
   */
  const getFeatureLabel = useCallback((featureKey: string): string | null => {
    return currentUser?.labels?.[featureKey] ?? null;
  }, [currentUser?.labels]);

  return {
    currentUser,
    isLoading,
    hasPermission,
    getFeatureLabel,
    refetch: fetchCurrentUser,
  };
};
