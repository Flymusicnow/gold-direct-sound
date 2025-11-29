import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SupporterAccess {
  hasAccess: boolean;
  tier: string | null;
  loading: boolean;
}

export const useSupporterAccess = (artistId: string, requiredTier?: string | null): SupporterAccess => {
  const { user } = useAuth();
  const [access, setAccess] = useState<SupporterAccess>({
    hasAccess: false,
    tier: null,
    loading: true,
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !artistId) {
        setAccess({ hasAccess: false, tier: null, loading: false });
        return;
      }

      // If content is not supporter-only, allow access
      if (!requiredTier) {
        setAccess({ hasAccess: true, tier: null, loading: false });
        return;
      }

      try {
        const { data: subscription, error } = await supabase
          .from("supporter_subscriptions")
          .select("tier, status")
          .eq("fan_user_id", user.id)
          .eq("artist_id", artistId)
          .eq("status", "active")
          .maybeSingle();

        if (error) throw error;

        if (!subscription) {
          setAccess({ hasAccess: false, tier: null, loading: false });
          return;
        }

        // Check tier compatibility
        // Gold tier has access to both basic and gold content
        // Basic tier only has access to basic content
        const hasAccess =
          subscription.tier === "gold" ||
          (subscription.tier === "basic" && requiredTier === "basic");

        setAccess({
          hasAccess,
          tier: subscription.tier,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking supporter access:", error);
        setAccess({ hasAccess: false, tier: null, loading: false });
      }
    };

    checkAccess();
  }, [user, artistId, requiredTier]);

  return access;
};
