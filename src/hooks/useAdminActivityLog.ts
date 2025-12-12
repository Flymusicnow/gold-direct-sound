import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export function useAdminActivityLog() {
  const { user } = useAuth();

  const logActivity = async (
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await supabase.from("admin_activity_logs").insert([{
        admin_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId || null,
        details: (details as Json) || null,
      }]);
    } catch (error) {
      console.error("Failed to log admin activity:", error);
    }
  };

  return { logActivity };
}
