import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQAHealthCheck, RouteCheckResult, DBCheckResult } from '@/hooks/useQAHealthCheck';
import { supabase } from '@/integrations/supabase/client';
import { isSentryConfigured } from '@/lib/sentry';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Monitor, 
  Smartphone, 
  Tablet,
  Database,
  Route,
  AlertTriangle,
  Clock,
  Send,
  Download,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RuntimeError {
  id: string;
  error_message: string;
  route: string | null;
  created_at: string;
  sentry_event_id: string | null;
}

interface ReportRun {
  id: string;
  run_type: string;
  overall_passed: boolean;
  route_checks_passed: number;
  route_checks_total: number;
  db_checks_passed: number;
  db_checks_total: number;
  errors_24h: number;
  created_at: string;
}

const DEVICE_PRESETS = [
  { name: 'iPhone SE', width: 375, height: 667, icon: Smartphone },
  { name: 'iPhone 14', width: 390, height: 844, icon: Smartphone },
  { name: 'Android', width: 412, height: 915, icon: Smartphone },
  { name: 'iPad', width: 768, height: 1024, icon: Tablet },
];

const PREVIEW_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Fan Portal', path: '/fan' },
  { name: 'Artist Studio', path: '/studio' },
  { name: 'Admin Dashboard', path: '/admin' },
  { name: 'Discover', path: '/discover' },
];

export default function AdminQA() {
  const { toast } = useToast();
  const { isRunning, results, runAllChecks, saveResults } = useQAHealthCheck();
  const [errors, setErrors] = useState<RuntimeError[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportRun[]>([]);
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_PRESETS[0]);
  const [selectedPage, setSelectedPage] = useState(PREVIEW_PAGES[0]);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [errorFilter, setErrorFilter] = useState<'1h' | '24h' | '7d'>('24h');

  // Fetch runtime errors
  const fetchErrors = async () => {
    setIsLoadingErrors(true);
    try {
      let query = supabase
        .from('runtime_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const now = new Date();
      if (errorFilter === '1h') {
        query = query.gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString());
      } else if (errorFilter === '24h') {
        query = query.gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
      } else {
        query = query.gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
      }

      const { data } = await query;
      setErrors(data || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setIsLoadingErrors(false);
    }
  };

  // Fetch report history
  const fetchReportHistory = async () => {
    try {
      const { data } = await supabase
        .from('qa_report_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setReportHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch report history:', error);
    }
  };

  useEffect(() => {
    fetchErrors();
    fetchReportHistory();
  }, [errorFilter]);

  const handleRunChecks = async () => {
    const qaResults = await runAllChecks();
    await saveResults(qaResults, 'manual');
    await fetchReportHistory();
    toast({
      title: qaResults.overallPassed ? '✅ All checks passed!' : '❌ Some checks failed',
      description: `Route: ${qaResults.routeChecks.filter(r => r.passed).length}/${qaResults.routeChecks.length} | DB: ${qaResults.dbChecks.filter(d => d.passed).length}/${qaResults.dbChecks.length}`,
    });
  };

  const handleSendReport = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-qa-report', {});
      if (error) throw error;
      toast({ title: 'QA Report sent!', description: 'Check admin emails for the report.' });
      await fetchReportHistory();
    } catch (error) {
      toast({ title: 'Failed to send report', description: String(error), variant: 'destructive' });
    }
  };

  const handleCopyStatusBoard = () => {
    if (!results) return;
    const routesPassed = results.routeChecks.filter(r => r.passed).length;
    const dbPassed = results.dbChecks.filter(d => d.passed).length;
    
    const text = `🧪 FlyMusic QA Status
📅 ${format(new Date(results.timestamp), 'MMM d, yyyy HH:mm')}
${results.overallPassed ? '✅ ALL SYSTEMS OPERATIONAL' : '❌ ISSUES DETECTED'}

📍 Routes: ${routesPassed}/${results.routeChecks.length}
🗄️ Database: ${dbPassed}/${results.dbChecks.length}
⚠️ Errors (24h): ${results.errorsLast24h}
📝 Activity Log: ${results.activityLogCheck.passed ? 'REAL ✅' : 'FAIL ❌'}`;

    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const getCategoryChecks = (category: string) => {
    return results?.routeChecks.filter(r => r.category === category) || [];
  };

  return (
    <AdminLayout title="QA Mode" description="System health checks, mobile preview, and error tracking">
      {/* Status Board Header */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {results ? (
                results.overallPassed ? (
                  <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                )
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {results 
                    ? results.overallPassed 
                      ? 'All Systems Operational' 
                      : 'Issues Detected'
                    : 'Ready to Run Checks'}
                </h2>
                {results && (
                  <p className="text-sm text-muted-foreground">
                    Last check: {format(new Date(results.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleRunChecks} disabled={isRunning}>
                {isRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run All Checks
              </Button>
              <Button variant="outline" onClick={handleSendReport} disabled={!results}>
                <Send className="h-4 w-4 mr-2" />
                Send Report
              </Button>
              <Button variant="outline" onClick={handleCopyStatusBoard} disabled={!results}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Status
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {results && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Routes</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {results.routeChecks.filter(r => r.passed).length}/{results.routeChecks.length}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Database</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {results.dbChecks.filter(d => d.passed).length}/{results.dbChecks.length}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Errors (24h)</span>
                </div>
                <p className="text-2xl font-bold mt-1">{results.errorsLast24h}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Activity Log</span>
                </div>
                <p className="text-lg font-bold mt-1">
                  {results.activityLogCheck.passed ? (
                    <Badge variant="default" className="bg-green-500">REAL ✓</Badge>
                  ) : (
                    <Badge variant="destructive">FAIL</Badge>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="preview">Mobile Preview</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <div className="grid md:grid-cols-2 gap-4">
            {['admin', 'fan', 'artist', 'public'].map((category) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize flex items-center justify-between">
                    {category} Routes
                    {results && (
                      <Badge variant={getCategoryChecks(category).every(r => r.passed) ? 'default' : 'destructive'}>
                        {getCategoryChecks(category).filter(r => r.passed).length}/{getCategoryChecks(category).length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {getCategoryChecks(category).map((check) => (
                        <RouteCheckRow key={check.route} check={check} />
                      ))}
                      {!results && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Run checks to see results
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Database Health
                {results && (
                  <Badge variant={results.dbChecks.every(d => d.passed) ? 'default' : 'destructive'}>
                    {results.dbChecks.filter(d => d.passed).length}/{results.dbChecks.length} Tables OK
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results?.dbChecks.map((check) => (
                  <DBCheckRow key={check.table} check={check} />
                ))}
                {!results && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Run checks to see database health
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mobile Preview Mode
                <div className="flex gap-2">
                  <Select
                    value={selectedDevice.name}
                    onValueChange={(name) => setSelectedDevice(DEVICE_PRESETS.find(d => d.name === name) || DEVICE_PRESETS[0])}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_PRESETS.map((device) => (
                        <SelectItem key={device.name} value={device.name}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedPage.path}
                    onValueChange={(path) => setSelectedPage(PREVIEW_PAGES.find(p => p.path === path) || PREVIEW_PAGES[0])}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PREVIEW_PAGES.map((page) => (
                        <SelectItem key={page.path} value={page.path}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div 
                className="border-8 border-foreground/20 rounded-[2rem] overflow-hidden bg-background shadow-xl"
                style={{ width: selectedDevice.width + 16, height: Math.min(selectedDevice.height, 600) + 16 }}
              >
                <iframe
                  src={selectedPage.path}
                  className="w-full h-full border-none"
                  title={`Preview: ${selectedPage.name}`}
                  style={{ width: selectedDevice.width, height: Math.min(selectedDevice.height, 600) }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Runtime Errors
                <div className="flex items-center gap-2">
                  {!isSentryConfigured() && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      ⚠️ Sentry not configured
                    </Badge>
                  )}
                  <Select value={errorFilter} onValueChange={(v) => setErrorFilter(v as any)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchErrors} disabled={isLoadingErrors}>
                    {isLoadingErrors ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {errors.length > 0 ? (
                  <div className="space-y-2">
                    {errors.map((error) => (
                      <div key={error.id} className="bg-muted/50 rounded-lg p-3 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-mono text-destructive break-all">
                            {error.error_message}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {format(new Date(error.created_at), 'HH:mm:ss')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {error.route && <Badge variant="outline">{error.route}</Badge>}
                          {error.sentry_event_id && (
                            <Badge variant="outline" className="font-mono">
                              Sentry: {error.sentry_event_id.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No errors in the selected time period</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {reportHistory.length > 0 ? (
                  <div className="space-y-2">
                    {reportHistory.map((run) => (
                      <div key={run.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {run.overall_passed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">
                              {run.overall_passed ? 'PASSED' : 'FAILED'}
                            </span>
                            <Badge variant="outline">{run.run_type}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(run.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Routes: {run.route_checks_passed}/{run.route_checks_total}</span>
                          <span>DB: {run.db_checks_passed}/{run.db_checks_total}</span>
                          <span>Errors: {run.errors_24h}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No report history yet
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function RouteCheckRow({ check }: { check: RouteCheckResult }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {check.passed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <code className="text-xs">{check.route}</code>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{check.responseTime}ms</span>
        {!check.passed && (
          <Badge variant="destructive" className="text-xs">
            {check.reason}
          </Badge>
        )}
      </div>
    </div>
  );
}

function DBCheckRow({ check }: { check: DBCheckResult }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 border-b last:border-0">
      <div className="flex items-center gap-3">
        {check.passed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        <span className="font-mono text-sm">{check.table}</span>
      </div>
      <div className="flex items-center gap-4">
        {check.passed && (
          <span className="text-sm font-medium">{check.count?.toLocaleString()} rows</span>
        )}
        <span className="text-xs text-muted-foreground">{check.responseTime}ms</span>
        {!check.passed && (
          <Badge variant="destructive" className="text-xs">
            {check.reason}
          </Badge>
        )}
      </div>
    </div>
  );
}
