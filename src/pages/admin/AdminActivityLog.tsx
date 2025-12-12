import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Activity, User, Settings, Shield, Database, Download, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchLogs();
  }, [filter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = (supabase.from("admin_activity_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filter !== "all") {
        query = query.eq("target_type", filter);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
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

  const exportToCSV = () => {
    const headers = ["Timestamp", "Action", "Target Type", "Target ID", "Details"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.target_type || "",
      log.target_id || "",
      log.details ? JSON.stringify(log.details) : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `admin_activity_log_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="flex flex-wrap items-center gap-4">
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
                    <SelectItem value="brand_application">Brand Applications</SelectItem>
                    <SelectItem value="spotlight_campaign">Campaigns</SelectItem>
                    <SelectItem value="feature_flag">Feature Flags</SelectItem>
                    <SelectItem value="beta_code">Beta Codes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(undefined); setEndDate(undefined); }}>
                  Clear Dates
                </Button>
              )}

              <div className="ml-auto">
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
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
