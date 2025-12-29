import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type BetaRole = 'fan' | 'artist';

interface RoleBetaAccess {
  hasAccess: boolean | null;
  loading: boolean;
  badge: string | null;
  refetch: () => Promise<void>;
}

/**
 * Role-specific beta access hook.
 * 
 * - For 'fan': Checks ONLY fan_beta_access table
 * - For 'artist': Checks ONLY artist_beta_access table
 * 
 * This ensures a fan must be in fan_beta_access to access fan portal,
 * and an artist must be in artist_beta_access to access studio portal.
 */
export function useRoleBetaAccess(role: BetaRole): RoleBetaAccess {
  const { user, hasRole } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Admins bypass beta access checks
    if (hasRole('admin')) {
      setHasAccess(true);
      setBadge('Admin');
      setLoading(false);
      return;
    }

    try {
      const table = role === 'fan' ? 'fan_beta_access' : 'artist_beta_access';
      
      const { data, error } = await supabase
        .from(table)
        .select('badge_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error(`Error checking ${role} beta access:`, error);
      }

      setHasAccess(!!data);
      setBadge(data?.badge_name || null);
    } catch (error) {
      console.error(`Error in ${role} checkAccess:`, error);
      setHasAccess(false);
      setBadge(null);
    } finally {
      setLoading(false);
    }
  }, [user, role, hasRole]);

  useEffect(() => {
    setLoading(true);
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, badge, refetch: checkAccess };
}
