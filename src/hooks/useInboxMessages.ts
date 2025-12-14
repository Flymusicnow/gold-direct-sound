import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InboxMessage {
  id: string;
  created_at: string;
  updated_at: string;
  type: string;
  title: string;
  summary: string | null;
  status: "unread" | "in_progress" | "resolved";
  priority: "critical" | "high" | "normal";
  dedupe_key: string;
  assigned_to: string | null;
  payload: Record<string, unknown> | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_summary: string | null;
  resolution_details: Record<string, unknown> | null;
  assigned_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  resolved_by_profile?: {
    full_name: string | null;
  };
}

export interface InboxUpdate {
  id: string;
  message_id: string;
  author_id: string | null;
  update_text: string;
  is_system: boolean;
  created_at: string;
  author_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface InboxFilters {
  status?: "unread" | "in_progress" | "resolved" | "all";
  priority?: "critical" | "high" | "normal" | "all";
}

export function useInboxMessages(filters?: InboxFilters) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("inbox_messages")
        .select(`
          *,
          assigned_profile:profiles!inbox_messages_assigned_to_fkey(full_name, avatar_url),
          resolved_by_profile:profiles!inbox_messages_resolved_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages((data as unknown as InboxMessage[]) || []);
    } catch (error) {
      console.error("Error fetching inbox messages:", error);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.priority]);

  const fetchCounts = useCallback(async () => {
    try {
      const { count: unread } = await supabase
        .from("inbox_messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "unread");

      const { count: inProgress } = await supabase
        .from("inbox_messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress");

      setUnreadCount(unread || 0);
      setInProgressCount(inProgress || 0);
    } catch (error) {
      console.error("Error fetching inbox counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchCounts();
  }, [fetchMessages, fetchCounts]);

  return {
    messages,
    loading,
    unreadCount,
    inProgressCount,
    totalActive: unreadCount + inProgressCount,
    hasUnread: unreadCount > 0,
    refetch: fetchMessages,
    refetchCounts: fetchCounts,
  };
}

export function useInboxMessage(id: string) {
  const { user } = useAuth();
  const [message, setMessage] = useState<InboxMessage | null>(null);
  const [updates, setUpdates] = useState<InboxUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessage = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inbox_messages")
        .select(`
          *,
          assigned_profile:profiles!inbox_messages_assigned_to_fkey(full_name, avatar_url),
          resolved_by_profile:profiles!inbox_messages_resolved_by_fkey(full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setMessage(data as unknown as InboxMessage);
    } catch (error) {
      console.error("Error fetching inbox message:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUpdates = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("inbox_updates")
        .select(`
          *,
          author_profile:profiles!inbox_updates_author_id_fkey(full_name, avatar_url)
        `)
        .eq("message_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUpdates((data as unknown as InboxUpdate[]) || []);
    } catch (error) {
      console.error("Error fetching inbox updates:", error);
    }
  }, [id]);

  const assignToMe = useCallback(async () => {
    if (!message || !user) return false;
    try {
      const { error } = await supabase
        .from("inbox_messages")
        .update({
          assigned_to: user.id,
          status: "in_progress",
        })
        .eq("id", message.id);

      if (error) throw error;

      // Add system update
      await supabase.from("inbox_updates").insert({
        message_id: message.id,
        author_id: user.id,
        update_text: "Tilldelad och påbörjad",
        is_system: true,
      });

      await fetchMessage();
      await fetchUpdates();
      return true;
    } catch (error) {
      console.error("Error assigning message:", error);
      return false;
    }
  }, [message, user, fetchMessage, fetchUpdates]);

  const updateStatus = useCallback(
    async (newStatus: "unread" | "in_progress" | "resolved") => {
      if (!message || !user) return false;
      try {
        const { error } = await supabase
          .from("inbox_messages")
          .update({ status: newStatus })
          .eq("id", message.id);

        if (error) throw error;

        // Add system update
        const statusLabels = {
          unread: "Markerad som oläst",
          in_progress: "Markerad som pågående",
          resolved: "Markerad som löst",
        };
        await supabase.from("inbox_updates").insert({
          message_id: message.id,
          author_id: user.id,
          update_text: statusLabels[newStatus],
          is_system: true,
        });

        await fetchMessage();
        await fetchUpdates();
        return true;
      } catch (error) {
        console.error("Error updating status:", error);
        return false;
      }
    },
    [message, user, fetchMessage, fetchUpdates]
  );

  const addUpdate = useCallback(
    async (text: string) => {
      if (!message || !user) return false;
      try {
        const { error } = await supabase.from("inbox_updates").insert({
          message_id: message.id,
          author_id: user.id,
          update_text: text,
          is_system: false,
        });

        if (error) throw error;
        await fetchUpdates();
        return true;
      } catch (error) {
        console.error("Error adding update:", error);
        return false;
      }
    },
    [message, user, fetchUpdates]
  );

  const resolve = useCallback(
    async (resolutionDetails: {
      problem: string;
      fix: string;
      verification: string;
      testedOn: string[];
    }) => {
      if (!message || !user) return false;
      try {
        // Auto-generate resolution summary (max 100 chars)
        const problemFirst = resolutionDetails.problem.split(".")[0].trim();
        const fixFirst = resolutionDetails.fix.split(".")[0].trim();
        let summary = `${problemFirst}. ${fixFirst}.`;
        if (summary.length > 100) {
          summary = summary.substring(0, 97) + "...";
        }

        const { error } = await supabase
          .from("inbox_messages")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            resolved_by: user.id,
            resolution_summary: summary,
            resolution_details: resolutionDetails,
          })
          .eq("id", message.id);

        if (error) throw error;

        // Add system update
        const testedOnText = resolutionDetails.testedOn.join(", ");
        await supabase.from("inbox_updates").insert({
          message_id: message.id,
          author_id: user.id,
          update_text: `Löst och verifierat på ${testedOnText}`,
          is_system: true,
        });

        await fetchMessage();
        await fetchUpdates();
        return true;
      } catch (error) {
        console.error("Error resolving message:", error);
        return false;
      }
    },
    [message, user, fetchMessage, fetchUpdates]
  );

  useEffect(() => {
    fetchMessage();
    fetchUpdates();
  }, [fetchMessage, fetchUpdates]);

  return {
    message,
    updates,
    loading,
    assignToMe,
    updateStatus,
    addUpdate,
    resolve,
    refetch: fetchMessage,
  };
}

// Function to create inbox messages from QA results
export async function createInboxMessagesFromQAResults(results: {
  routeChecks: { route: string; status: string; category: string }[];
  dbChecks: { table: string; status: string; responseTime: number }[];
  errorCount: number;
}) {
  const { routeChecks, dbChecks, errorCount } = results;

  // Count failing routes
  const failingRoutes = routeChecks.filter((r) => r.status !== "pass");
  const failingTables = dbChecks.filter((d) => d.status !== "pass");
  const slowTables = dbChecks.filter((d) => d.responseTime > 2000);

  // Determine priority for routes
  const getRoutePriority = (count: number): "critical" | "high" | "normal" => {
    if (count >= 10) return "critical";
    if (count >= 3) return "high";
    return "normal";
  };

  // Determine priority for errors
  const getErrorPriority = (count: number): "critical" | "high" | "normal" => {
    if (count >= 50) return "critical";
    if (count >= 10) return "high";
    return "normal";
  };

  // Create messages for failing routes
  if (failingRoutes.length > 0) {
    const dedupeKey =
      failingRoutes.length >= 3
        ? "qa:routes_failing:multiple"
        : `qa:routes_failing:${failingRoutes[0].route}`;

    const title =
      failingRoutes.length >= 3
        ? `${failingRoutes.length} sidor fungerar inte`
        : `Sidan ${failingRoutes[0].route} fungerar inte`;

    const summary = failingRoutes.map((r) => r.route).join(", ");

    await supabase.rpc("upsert_inbox_message", {
      _dedupe_key: dedupeKey,
      _title: title,
      _summary: summary,
      _priority: getRoutePriority(failingRoutes.length),
      _payload: { type: "route_check", routes: failingRoutes },
    });
  }

  // Create messages for database issues
  if (failingTables.length > 0 || slowTables.length > 0) {
    const issues = [...failingTables, ...slowTables];
    const dedupeKey =
      issues.length >= 3
        ? "qa:database_health:multiple"
        : `qa:database_health:${issues[0].table}`;

    const title =
      failingTables.length > 0
        ? "Databasproblem upptäckt"
        : "Databasen är långsam";

    const summary = issues.map((t) => t.table).join(", ");

    await supabase.rpc("upsert_inbox_message", {
      _dedupe_key: dedupeKey,
      _title: title,
      _summary: summary,
      _priority: failingTables.length > 0 ? "high" : "normal",
      _payload: { type: "database_check", tables: issues },
    });
  }

  // Create messages for runtime errors
  if (errorCount > 0) {
    const dedupeKey =
      errorCount >= 10
        ? "qa:runtime_errors:multiple"
        : "qa:runtime_errors:recent";

    const title = `${errorCount} fel under senaste 24 timmarna`;
    const summary = `${errorCount} runtime errors loggade`;

    await supabase.rpc("upsert_inbox_message", {
      _dedupe_key: dedupeKey,
      _title: title,
      _summary: summary,
      _priority: getErrorPriority(errorCount),
      _payload: { type: "runtime_errors", count: errorCount },
    });
  }
}
