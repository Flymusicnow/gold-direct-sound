import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Settings, Shield, Database } from "lucide-react";

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = (supabase.from("admin_activity_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("target_type", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="h-4 w-4" />;
    if (action.includes("setting")) return <Settings className="h-4 w-4" />;
    if (action.includes("role")) return <Shield className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("suspend")) return "destructive";
    if (action.includes("create") || action.includes("approve")) return "default";
    if (action.includes("update")) return "secondary";
    return "outline";
  };

  return (
    <AdminLayout title="Activity Log" description="View admin actions and system events">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter by:</span>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="artist">Artists</SelectItem>
                    <SelectItem value="feature_flag">Feature Flags</SelectItem>
                    <SelectItem value="beta_code">Beta Codes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading activity...</p>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground">No activity logs found</p>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-full bg-muted">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionColor(log.action) as any}>
                            {log.action}
                          </Badge>
                          {log.target_type && (
                            <Badge variant="outline">{log.target_type}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">
                          {log.details ? JSON.stringify(log.details) : "No details"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
