import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Search, RefreshCw, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import { format } from "date-fns";

interface EdgeFunctionLog {
  id: string;
  correlation_id: string;
  function_name: string;
  step: string;
  level: string;
  message: string | null;
  details: Record<string, unknown> | null;
  execution_time_ms: number | null;
  status_code: number | null;
  created_at: string;
}

interface FunctionStats {
  function_name: string;
  total: number;
  errors: number;
  avg_time: number;
  last_execution: string;
}

export default function AdminEdgeFunctions() {
  const [logs, setLogs] = useState<EdgeFunctionLog[]>([]);
  const [stats, setStats] = useState<FunctionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCorrelationId, setSearchCorrelationId] = useState("");
  const [filterFunction, setFilterFunction] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [traceResults, setTraceResults] = useState<EdgeFunctionLog[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("edge_function_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterFunction !== "all") {
      query = query.eq("function_name", filterFunction);
    }
    if (filterLevel !== "all") {
      query = query.eq("level", filterLevel);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as EdgeFunctionLog[]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from("edge_function_logs")
      .select("function_name, level, execution_time_ms, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (data) {
      const grouped: Record<string, { total: number; errors: number; times: number[]; last: string }> = {};
      for (const log of data) {
        if (!grouped[log.function_name]) {
          grouped[log.function_name] = { total: 0, errors: 0, times: [], last: log.created_at };
        }
        grouped[log.function_name].total++;
        if (log.level === "error") grouped[log.function_name].errors++;
        if (log.execution_time_ms) grouped[log.function_name].times.push(log.execution_time_ms);
        if (log.created_at > grouped[log.function_name].last) {
          grouped[log.function_name].last = log.created_at;
        }
      }

      const statsArray = Object.entries(grouped).map(([name, data]) => ({
        function_name: name,
        total: data.total,
        errors: data.errors,
        avg_time: data.times.length ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length) : 0,
        last_execution: data.last,
      }));
      setStats(statsArray.sort((a, b) => b.total - a.total));
    }
  };

  const traceCorrelationId = async () => {
    if (!searchCorrelationId.trim()) return;
    const { data } = await supabase
      .from("edge_function_logs")
      .select("*")
      .eq("correlation_id", searchCorrelationId.trim())
      .order("created_at", { ascending: true });
    setTraceResults((data as EdgeFunctionLog[]) || []);
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filterFunction, filterLevel]);

  const uniqueFunctions = [...new Set(logs.map(l => l.function_name))];
  const totalExecutions = stats.reduce((a, b) => a + b.total, 0);
  const totalErrors = stats.reduce((a, b) => a + b.errors, 0);
  const errorRate = totalExecutions ? ((totalErrors / totalExecutions) * 100).toFixed(1) : "0";

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error": return <Badge variant="destructive">ERROR</Badge>;
      case "warn": return <Badge className="bg-yellow-500/20 text-yellow-400">WARN</Badge>;
      default: return <Badge variant="secondary">INFO</Badge>;
    }
  };

  return (
    <AdminLayout title="Edge Function Monitor" description="Real-time logs, health metrics, and correlation ID tracing">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Edge Functions
            </h1>
            <p className="text-muted-foreground">Monitor execution, view logs, and trace errors</p>
          </div>
          <Button onClick={() => { fetchLogs(); fetchStats(); }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalExecutions}</div>
              <p className="text-sm text-muted-foreground">Executions (24h)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{errorRate}%</div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.length}</div>
              <p className="text-sm text-muted-foreground">Active Functions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats[0]?.function_name?.replace(/-/g, " ") || "—"}</div>
              <p className="text-sm text-muted-foreground">Most Active</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs">Live Logs</TabsTrigger>
            <TabsTrigger value="functions">Function Health</TabsTrigger>
            <TabsTrigger value="trace">Trace Request</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex gap-4">
              <Select value={filterFunction} onValueChange={setFilterFunction}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All functions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All functions</SelectItem>
                  {uniqueFunctions.map(fn => (
                    <SelectItem key={fn} value={fn}>{fn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                  ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No logs found</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getLevelBadge(log.level)}
                              <span className="font-mono text-sm font-medium">{log.function_name}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{log.step}</span>
                            </div>
                            {log.message && (
                              <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="font-mono">{log.correlation_id.slice(0, 8)}...</span>
                              {log.execution_time_ms && <span>{log.execution_time_ms}ms</span>}
                              {log.status_code && <span>HTTP {log.status_code}</span>}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((fn) => (
                <Card key={fn.function_name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono flex items-center gap-2">
                      {fn.errors === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {fn.function_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="font-bold">{fn.total}</div>
                        <div className="text-xs text-muted-foreground">Calls</div>
                      </div>
                      <div>
                        <div className="font-bold text-destructive">{fn.errors}</div>
                        <div className="text-xs text-muted-foreground">Errors</div>
                      </div>
                      <div>
                        <div className="font-bold">{fn.avg_time}ms</div>
                        <div className="text-xs text-muted-foreground">Avg</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trace" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter correlation ID..."
                value={searchCorrelationId}
                onChange={(e) => setSearchCorrelationId(e.target.value)}
                className="font-mono"
              />
              <Button onClick={traceCorrelationId}>
                <Search className="h-4 w-4 mr-2" />
                Trace
              </Button>
            </div>

            {traceResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Request Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {traceResults.map((log, i) => (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${log.level === "error" ? "bg-destructive" : "bg-primary"}`} />
                          {i < traceResults.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            {getLevelBadge(log.level)}
                            <span className="font-medium">{log.step}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "HH:mm:ss.SSS")}
                            </span>
                          </div>
                          {log.message && <p className="text-sm text-muted-foreground mt-1">{log.message}</p>}
                          {log.details && (
                            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
