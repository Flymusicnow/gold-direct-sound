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
      const { data, error } = await supabase
        .from('artist_beta_access')
        .select('badge_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking beta access:', error);
      }

      setHasBetaAccess(!!data);
      setBadge(data?.badge_name || null);
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
