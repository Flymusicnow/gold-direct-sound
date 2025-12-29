import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = 'fan' | 'artist' | 'brand' | 'admin' | null;

interface UserAccessState {
  authenticated: boolean;
  role: UserRole;
  hasFanAccess: boolean;
  hasArtistAccess: boolean;
  fanOnboarded: boolean;
  artistOnboarded: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Central hook for user access state.
 * Consolidates auth, role, beta access, and onboarding status.
 */
export function useUserAccessState(): UserAccessState {
  const { user, loading: authLoading, hasRole } = useAuth();
  const [hasFanAccess, setHasFanAccess] = useState(false);
  const [hasArtistAccess, setHasArtistAccess] = useState(false);
  const [fanOnboarded, setFanOnboarded] = useState(false);
  const [artistOnboarded, setArtistOnboarded] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setHasFanAccess(false);
      setHasArtistAccess(false);
      setFanOnboarded(false);
      setArtistOnboarded(false);
      setAccessLoading(false);
      return;
    }

    // Admins bypass all checks
    if (hasRole('admin')) {
      setHasFanAccess(true);
      setHasArtistAccess(true);
      setFanOnboarded(true);
      setArtistOnboarded(true);
      setAccessLoading(false);
      return;
    }

    try {
      // Check fan beta access and onboarding in parallel
      const [fanAccessResult, artistAccessResult, fanOnboardingResult, artistOnboardingResult] = await Promise.all([
        supabase
          .from('fan_beta_access')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('artist_beta_access')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('fan_onboarding_progress')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('artist_onboarding_progress')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      // Legacy fallback: if user has completed onboarding but lacks explicit beta access record,
      // grant implicit access (handles users who registered before beta_access tables existed)
      const hasImplicitFanAccess = fanOnboardingResult.data?.onboarding_completed && !fanAccessResult.data;
      const hasImplicitArtistAccess = artistOnboardingResult.data?.onboarding_completed && !artistAccessResult.data;
      
      setHasFanAccess(!!fanAccessResult.data || hasImplicitFanAccess);
      setHasArtistAccess(!!artistAccessResult.data || hasImplicitArtistAccess);
      setFanOnboarded(fanOnboardingResult.data?.onboarding_completed ?? false);
      setArtistOnboarded(artistOnboardingResult.data?.onboarding_completed ?? false);
    } catch (error) {
      console.error('Error checking access state:', error);
    } finally {
      setAccessLoading(false);
    }
  }, [user, hasRole]);

  useEffect(() => {
    setAccessLoading(true);
    checkAccess();
  }, [checkAccess]);

  // Determine primary role
  let role: UserRole = null;
  if (hasRole('admin')) role = 'admin';
  else if (hasRole('brand')) role = 'brand';
  else if (hasRole('artist')) role = 'artist';
  else if (hasRole('fan')) role = 'fan';

  return {
    authenticated: !!user,
    role,
    hasFanAccess,
    hasArtistAccess,
    fanOnboarded,
    artistOnboarded,
    loading: authLoading || accessLoading,
    refetch: checkAccess,
  };
}
