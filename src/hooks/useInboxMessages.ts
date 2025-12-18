import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InboxLanguage } from "@/i18n/inbox";

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
  assigned_key: string | null; // NEW: team assignment key
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
  language?: InboxLanguage;
  author_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface InboxFilters {
  status?: "unread" | "in_progress" | "resolved" | "all";
  priority?: "critical" | "high" | "normal" | "all";
  type?: string; // NEW: filter by message type
  excludeResolved?: boolean; // NEW: exclude resolved items
}

export function useInboxMessages(filters?: InboxFilters) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [qaCount, setQaCount] = useState(0);

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
      // NEW: type filter
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      // NEW: exclude resolved
      if (filters?.excludeResolved) {
        query = query.neq("status", "resolved");
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages((data as unknown as InboxMessage[]) || []);
    } catch (error) {
      console.error("Error fetching inbox messages:", error);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.priority, filters?.type, filters?.excludeResolved]);

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

      // NEW: QA count (contextual_report type, not resolved)
      const { count: qa } = await supabase
        .from("inbox_messages")
        .select("*", { count: "exact", head: true })
        .eq("type", "contextual_report")
        .neq("status", "resolved");

      setUnreadCount(unread || 0);
      setInProgressCount(inProgress || 0);
      setQaCount(qa || 0);
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
    qaCount,
    totalActive: unreadCount + inProgressCount,
    hasUnread: unreadCount > 0,
    refetch: fetchMessages,
    refetchCounts: fetchCounts,
  };
}

export function useInboxMessage(id: string, userLanguage: InboxLanguage = 'en') {
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

  // Get system update text based on user language
  const getSystemText = useCallback((key: 'assigned' | 'unread' | 'in_progress' | 'resolved' | 'resolved_verified', testedOn?: string) => {
    const texts = {
      en: {
        assigned: 'Assigned and started',
        unread: 'Marked as unread',
        in_progress: 'Marked as in progress',
        resolved: 'Marked as resolved',
        resolved_verified: `Resolved and verified on ${testedOn}`,
      },
      sv: {
        assigned: 'Tilldelad och påbörjad',
        unread: 'Markerad som oläst',
        in_progress: 'Markerad som pågående',
        resolved: 'Markerad som löst',
        resolved_verified: `Löst och verifierat på ${testedOn}`,
      },
    };
    return texts[userLanguage][key];
  }, [userLanguage]);

  const assignToMe = useCallback(async () => {
    if (!message || !user) return false;
    try {
      const { error } = await supabase
        .from("inbox_messages")
        .update({
          assigned_to: user.id,
          assigned_key: null, // Clear key when assigning to real user
          status: "in_progress",
        })
        .eq("id", message.id);

      if (error) throw error;

      // Add system update with language
      await supabase.from("inbox_updates").insert({
        message_id: message.id,
        author_id: user.id,
        update_text: getSystemText('assigned'),
        is_system: true,
        language: userLanguage,
      });

      await fetchMessage();
      await fetchUpdates();
      return true;
    } catch (error) {
      console.error("Error assigning message:", error);
      return false;
    }
  }, [message, user, fetchMessage, fetchUpdates, getSystemText, userLanguage]);

  // NEW: Assign to a team key (clears assigned_to)
  const assignToKey = useCallback(async (key: string) => {
    if (!message || !user) return false;
    try {
      const { error } = await supabase
        .from("inbox_messages")
        .update({
          assigned_to: null, // Clear user assignment
          assigned_key: key, // Set team key
          status: "in_progress",
        })
        .eq("id", message.id);

      if (error) throw error;

      // Get display label for the key
      const labelMap: Record<string, string> = {
        'team:johan': 'Johan',
        'team:esuni': 'Esuni',
        'team:lajo': 'Lajo',
        'team:qa_team': 'QA Team',
      };

      await supabase.from("inbox_updates").insert({
        message_id: message.id,
        author_id: user.id,
        update_text: `Assigned to ${labelMap[key] || key}`,
        is_system: true,
        language: userLanguage,
      });

      await fetchMessage();
      await fetchUpdates();
      return true;
    } catch (error) {
      console.error("Error assigning to key:", error);
      return false;
    }
  }, [message, user, fetchMessage, fetchUpdates, userLanguage]);

  // NEW: Unassign (clear both assigned_to and assigned_key)
  const unassign = useCallback(async () => {
    if (!message || !user) return false;
    try {
      const { error } = await supabase
        .from("inbox_messages")
        .update({
          assigned_to: null,
          assigned_key: null,
        })
        .eq("id", message.id);

      if (error) throw error;

      await supabase.from("inbox_updates").insert({
        message_id: message.id,
        author_id: user.id,
        update_text: 'Unassigned',
        is_system: true,
        language: userLanguage,
      });

      await fetchMessage();
      await fetchUpdates();
      return true;
    } catch (error) {
      console.error("Error unassigning:", error);
      return false;
    }
  }, [message, user, fetchMessage, fetchUpdates, userLanguage]);

  const updateStatus = useCallback(
    async (newStatus: "unread" | "in_progress" | "resolved") => {
      if (!message || !user) return false;
      try {
        const { error } = await supabase
          .from("inbox_messages")
          .update({ status: newStatus })
          .eq("id", message.id);

        if (error) throw error;

        // Add system update with language
        await supabase.from("inbox_updates").insert({
          message_id: message.id,
          author_id: user.id,
          update_text: getSystemText(newStatus),
          is_system: true,
          language: userLanguage,
        });

        await fetchMessage();
        await fetchUpdates();
        return true;
      } catch (error) {
        console.error("Error updating status:", error);
        return false;
      }
    },
    [message, user, fetchMessage, fetchUpdates, getSystemText, userLanguage]
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
          language: userLanguage,
        });

        if (error) throw error;
        await fetchUpdates();
        return true;
      } catch (error) {
        console.error("Error adding update:", error);
        return false;
      }
    },
    [message, user, fetchUpdates, userLanguage]
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

        // Store language with resolution details
        const detailsWithLanguage = {
          ...resolutionDetails,
          language: userLanguage,
        };

        const { error } = await supabase
          .from("inbox_messages")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            resolved_by: user.id,
            resolution_summary: summary,
            resolution_details: detailsWithLanguage,
          })
          .eq("id", message.id);

        if (error) throw error;

        // Add system update with language
        const testedOnText = resolutionDetails.testedOn.join(", ");
        await supabase.from("inbox_updates").insert({
          message_id: message.id,
          author_id: user.id,
          update_text: getSystemText('resolved_verified', testedOnText),
          is_system: true,
          language: userLanguage,
        });

        await fetchMessage();
        await fetchUpdates();
        return true;
      } catch (error) {
        console.error("Error resolving message:", error);
        return false;
      }
    },
    [message, user, fetchMessage, fetchUpdates, userLanguage, getSystemText]
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
    assignToKey,
    unassign,
    updateStatus,
    addUpdate,
    resolve,
    refetch: fetchMessage,
  };
}

// Import QAResults type for proper typing
import type { QAResults } from '@/hooks/useQAHealthCheck';

// Function to create inbox messages from QA results
export async function createInboxMessagesFromQAResults(
  results: QAResults | null,
  systemError?: Error | null
) {
  // If system error occurred (network offline, exception), create critical inbox item
  if (systemError || !results) {
    try {
      await supabase.rpc("upsert_inbox_message", {
        _dedupe_key: "qa:system_failure",
        _title: "QA checks could not complete",
        _summary: systemError?.message || "Unknown system error - checks failed to run",
        _priority: "critical",
        _payload: {
          type: "system_failure",
          error: systemError?.message || "Unknown error",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error("Failed to create system failure inbox message:", e);
    }
    return;
  }

  const { routeChecks, dbChecks, errorsLast24h } = results;

  // Count failing routes (use passed: boolean)
  const failingRoutes = routeChecks.filter((r) => !r.passed);
  const failingTables = dbChecks.filter((d) => !d.passed);
  const slowTables = dbChecks.filter((d) => d.passed && d.responseTime > 2000);

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

  try {
    // Create messages for failing routes
    if (failingRoutes.length > 0) {
      const dedupeKey =
        failingRoutes.length >= 3
          ? "qa:routes_failing:multiple"
          : `qa:routes_failing:${failingRoutes[0].route}`;

      const title =
        failingRoutes.length >= 3
          ? `${failingRoutes.length} routes are failing`
          : `Route ${failingRoutes[0].route} is failing`;

      const summary = failingRoutes.map((r) => `${r.route} (${r.reason})`).join(", ");

      await supabase.rpc("upsert_inbox_message", {
        _dedupe_key: dedupeKey,
        _title: title,
        _summary: summary.substring(0, 500),
        _priority: getRoutePriority(failingRoutes.length),
        _payload: { type: "route_check", routes: failingRoutes.map(r => ({ route: r.route, reason: r.reason, status: r.status })) },
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
          ? "Database issues detected"
          : "Database is slow";

      const summary = issues.map((t) => `${t.table} (${t.reason})`).join(", ");

      await supabase.rpc("upsert_inbox_message", {
        _dedupe_key: dedupeKey,
        _title: title,
        _summary: summary.substring(0, 500),
        _priority: failingTables.length > 0 ? "high" : "normal",
        _payload: { type: "database_check", tables: issues.map(t => ({ table: t.table, reason: t.reason, responseTime: t.responseTime })) },
      });
    }

    // Create messages for runtime errors
    if (errorsLast24h > 0) {
      const dedupeKey =
        errorsLast24h >= 10
          ? "qa:runtime_errors:multiple"
          : "qa:runtime_errors:recent";

      const title = `${errorsLast24h} errors in last 24 hours`;
      const summary = `${errorsLast24h} runtime errors logged`;

      await supabase.rpc("upsert_inbox_message", {
        _dedupe_key: dedupeKey,
        _title: title,
        _summary: summary,
        _priority: getErrorPriority(errorsLast24h),
        _payload: { type: "runtime_errors", count: errorsLast24h },
      });
    }
  } catch (e) {
    console.error("Failed to create inbox messages from QA results:", e);
  }
}
