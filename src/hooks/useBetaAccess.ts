import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BetaAccess {
  hasBetaAccess: boolean | null;
  loading: boolean;
  badge: string | null;
  refetch: () => Promise<void>;
}

export function useBetaAccess(): BetaAccess {
  const { user, hasRole } = useAuth();
  const [hasBetaAccess, setHasBetaAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<string | null>(null);

  const checkAccess = async () => {
    if (!user) {
      setHasBetaAccess(false);
      setLoading(false);
      return;
    }

    // Admins bypass the gate
    if (hasRole('admin')) {
      setHasBetaAccess(true);
      setBadge('Admin');
      setLoading(false);
      return;
    }

    try {
      // Check artist_beta_access table
      const { data: artistData, error: artistError } = await supabase
        .from('artist_beta_access')
        .select('badge_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (artistError && artistError.code !== 'PGRST116') {
        console.error('Error checking artist beta access:', artistError);
      }

      // Check fan_beta_access table
      const { data: fanData, error: fanError } = await supabase
        .from('fan_beta_access')
        .select('badge_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fanError && fanError.code !== 'PGRST116') {
        console.error('Error checking fan beta access:', fanError);
      }

      // User has access if they exist in either table
      const hasAccess = !!artistData || !!fanData;
      const badgeName = artistData?.badge_name || fanData?.badge_name || null;

      setHasBetaAccess(hasAccess);
      setBadge(badgeName);
    } catch (error) {
      console.error('Error in checkAccess:', error);
      setHasBetaAccess(false);
      setBadge(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [user]);

  return { hasBetaAccess, loading, badge, refetch: checkAccess };
}
