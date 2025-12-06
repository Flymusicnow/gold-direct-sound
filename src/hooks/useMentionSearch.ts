import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MentionUser {
  id: string;
  full_name: string | null;
  email: string;
}

export function useMentionSearch() {
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUsers = useCallback(() => {
    setUsers([]);
  }, []);

  return { users, searchUsers, clearUsers, loading };
}
