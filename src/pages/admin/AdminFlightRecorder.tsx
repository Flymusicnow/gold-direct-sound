import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlowTreeView } from "@/components/admin/FlowTreeView";
import { 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, subHours, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface TelemetryEvent {
  id: string;
  trace_id: string;
  flow: string;
  step: string;
  status: string;
  timestamp: string;
  duration_ms: number | null;
  user_id: string | null;
  session_id: string;
  location: string;
  meta: Json | null;
  decoded_error: string | null;
  created_at: string;
}

interface FlowSummary {
  trace_id: string;
  flow: string;
  status: 'ok' | 'fail' | 'warn' | 'in_progress';
  started_at: string;
  duration_ms?: number;
  user_id?: string;
  step_count: number;
  failing_step?: string;
  decoded_error?: string;
  events: TelemetryEvent[];
}

export default function AdminFlightRecorder() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTraceId, setSearchTraceId] = useState("");
  const [flowFilter, setFlowFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("24h");
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    failed: 0,
    success: 0,
    avgDuration: 0,
  });

  const fetchFlows = async () => {
    setLoading(true);
    try {
      // Calculate time filter
      let fromTime = subHours(new Date(), 24);
      if (timeFilter === '1h') fromTime = subHours(new Date(), 1);
      if (timeFilter === '6h') fromTime = subHours(new Date(), 6);
      if (timeFilter === '7d') fromTime = subDays(new Date(), 7);

      // Fetch events
      let query = supabase
        .from('telemetry_events')
        .select('*')
        .gte('timestamp', fromTime.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (searchTraceId) {
        query = query.ilike('trace_id', `%${searchTraceId}%`);
      }

      if (flowFilter !== 'all') {
        query = query.eq('flow', flowFilter);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      // Group events by trace_id
      const traceMap = new Map<string, TelemetryEvent[]>();
      (events || []).forEach((event: TelemetryEvent) => {
        const existing = traceMap.get(event.trace_id) || [];
        existing.push(event);
        traceMap.set(event.trace_id, existing);
      });

      // Create flow summaries
      const flowSummaries: FlowSummary[] = [];
      traceMap.forEach((traceEvents, traceId) => {
        const sortedEvents = traceEvents.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        const failedEvent = sortedEvents.find(e => e.status === 'fail');
        
        // Determine overall status
        let status: 'ok' | 'fail' | 'warn' | 'in_progress' = 'ok';
        if (failedEvent) {
          status = 'fail';
        } else if (sortedEvents.some(e => e.status === 'warn')) {
          status = 'warn';
        } else if (!sortedEvents.some(e => e.step === 'flow_end')) {
          status = 'in_progress';
        }

        // Calculate duration
        const duration = lastEvent.duration_ms || 
          (new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime());

        flowSummaries.push({
          trace_id: traceId,
          flow: firstEvent.flow,
          status,
          started_at: firstEvent.timestamp,
          duration_ms: duration,
          user_id: firstEvent.user_id,
          step_count: sortedEvents.length,
          failing_step: failedEvent?.step,
          decoded_error: failedEvent?.decoded_error,
          events: sortedEvents,
        });
      });

      // Apply status filter
      let filteredFlows = flowSummaries;
      if (statusFilter !== 'all') {
        filteredFlows = flowSummaries.filter(f => f.status === statusFilter);
      }

      // Sort by time (most recent first)
      filteredFlows.sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );

      setFlows(filteredFlows);

      // Calculate stats
      const failed = flowSummaries.filter(f => f.status === 'fail').length;
      const success = flowSummaries.filter(f => f.status === 'ok').length;
      const durations = flowSummaries
        .filter(f => f.duration_ms)
        .map(f => f.duration_ms!);
      const avgDuration = durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      setStats({
        total: flowSummaries.length,
        failed,
        success,
        avgDuration,
      });
    } catch (error) {
      console.error('Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [timeFilter, flowFilter, statusFilter]);

  // Get unique flow names for filter
  const uniqueFlows = [...new Set(flows.map(f => f.flow))];

  return (
    <AdminLayout title="Flight Recorder" description="End-to-end flow debugging and telemetry viewer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Flight Recorder
            </h1>
            <p className="text-muted-foreground">
              End-to-end flow debugging and telemetry viewer
            </p>
          </div>
          <Button onClick={fetchFlows} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Flows</div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{stats.success}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.avgDuration}ms</div>
              <div className="text-xs text-muted-foreground">Avg Duration</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by trace ID..."
                  value={searchTraceId}
                  onChange={(e) => setSearchTraceId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFlows()}
                  className="pl-9"
                />
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1h</SelectItem>
                  <SelectItem value="6h">Last 6h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7d</SelectItem>
                </SelectContent>
              </Select>
              <Select value={flowFilter} onValueChange={setFlowFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Flow type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flows</SelectItem>
                  {uniqueFlows.map(flow => (
                    <SelectItem key={flow} value={flow}>{flow}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="fail">Failed</SelectItem>
                  <SelectItem value="ok">Success</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Flow List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : flows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No flows found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            flows.map((flow) => (
              <Card 
                key={flow.trace_id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  flow.status === 'fail' && "border-destructive/50 bg-destructive/5",
                  expandedTraceId === flow.trace_id && "ring-2 ring-primary"
                )}
                onClick={() => setExpandedTraceId(
                  expandedTraceId === flow.trace_id ? null : flow.trace_id
                )}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {flow.status === 'fail' ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : flow.status === 'ok' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <div className="font-medium">{flow.flow}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {flow.trace_id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {flow.failing_step && (
                        <div className="text-sm text-destructive">
                          Failed at: <span className="font-medium">{flow.failing_step}</span>
                        </div>
                      )}
                      <Badge variant="outline">{flow.step_count} steps</Badge>
                      <span className="text-sm text-muted-foreground">
                        {flow.duration_ms}ms
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(flow.started_at), 'MMM d, HH:mm:ss')}
                      </span>
                      {expandedTraceId === flow.trace_id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  
                  {flow.decoded_error && (
                    <div className="mt-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-1.5">
                      {flow.decoded_error}
                    </div>
                  )}
                </CardContent>
                
                {expandedTraceId === flow.trace_id && (
                  <div className="border-t" onClick={(e) => e.stopPropagation()}>
                    <FlowTreeView events={flow.events} className="border-0 shadow-none" />
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
