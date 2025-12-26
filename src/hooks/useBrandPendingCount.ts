import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useBrandPendingCount() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPendingCount();
    }
  }, [user]);

  const loadPendingCount = async () => {
    if (!user) return;

    try {
      // Get brand entity for this user
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminData) {
        setLoading(false);
        return;
      }

      // Get opportunities for this entity
      const { data: opps } = await supabase
        .from("collab_opportunities")
        .select("id")
        .eq("collab_entity_id", adminData.collab_entity_id);

      if (opps && opps.length > 0) {
        const oppIds = opps.map((o) => o.id);

        // Get pending applications count
        const { count } = await supabase
          .from("collab_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("opportunity_id", oppIds);

        setPendingCount(count || 0);
      }
    } catch (error) {
      console.error("Error loading pending count:", error);
    } finally {
      setLoading(false);
    }
  };

  return { pendingCount, loading, refresh: loadPendingCount };
}
