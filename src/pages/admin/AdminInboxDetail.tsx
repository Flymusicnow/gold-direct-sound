import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInboxMessage, InboxUpdate } from "@/hooks/useInboxMessages";
import { useInboxLanguage } from "@/hooks/useInboxLanguage";
import { InboxLanguageSelector } from "@/components/admin/InboxLanguageSelector";
import { LanguageAwareText } from "@/components/admin/LanguageAwareText";
import { ResolveInboxDialog } from "@/components/admin/ResolveInboxDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Brain,
  Bug,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Gauge,
  Mail,
  Play,
  Send,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow, format, Locale } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { InboxLanguage } from "@/i18n/inbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AdminInboxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useInboxLanguage();
  const { userRoles } = useAuth();
  
  const { message, updates, loading, assignToMe, updateStatus, addUpdate, resolve } =
    useInboxMessage(id || "", language);

  const [newUpdate, setNewUpdate] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [routeErrors, setRouteErrors] = useState<any[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const dateLocale = language === "sv" ? sv : enUS;

  // Extract AI context from payload
  const aiContext = message?.payload ? (message.payload as { ai_context?: any }).ai_context : null;
  const reportRoute = aiContext?.route;
  const reportUserRole = aiContext?.user_role;
  const currentUserRole = userRoles?.[0] || 'admin';
  const hasRoleMismatch = reportUserRole && reportUserRole !== currentUserRole && reportUserRole !== 'admin';

  // Build repro URL for contextual reports
  const buildReproUrl = () => {
    if (!message?.payload) return null;
    if (!aiContext?.route) return null;
    
    const origin = window.location.origin;
    const route = aiContext.route;
    const reportId = aiContext.report_id || message.id;
    return `${origin}${route}?__issue=${reportId}&__repro=1`;
  };

  const reproUrl = message?.type === 'contextual_report' ? buildReproUrl() : null;

  // Fetch route errors when viewing debug tab
  useEffect(() => {
    if (activeTab === 'debug' && reportRoute && message?.type === 'contextual_report') {
      fetchRouteErrors();
    }
  }, [activeTab, reportRoute, message?.type]);

  const fetchRouteErrors = async () => {
    if (!reportRoute) return;
    setLoadingErrors(true);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('runtime_errors')
        .select('*')
        .eq('route', reportRoute)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(20);
      setRouteErrors(data || []);
    } catch (err) {
      console.error('Failed to fetch route errors:', err);
    }
    setLoadingErrors(false);
  };

  const handleOpenRepro = () => {
    if (reproUrl) {
      navigate(reproUrl.replace(window.location.origin, ''));
    }
  };

  const handleOpenReproNewTab = () => {
    if (reproUrl) {
      window.open(reproUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyReproLink = async () => {
    if (reproUrl) {
      try {
        await navigator.clipboard.writeText(reproUrl);
        toast({ title: "Repro link copied!", description: "Share with other developers" });
      } catch (err) {
        console.log('Repro URL:', reproUrl);
        toast({ title: "Link logged to console", description: "Clipboard access failed" });
      }
    }
  };

  const handleAssign = async () => {
    const success = await assignToMe();
    if (success) {
      toast({ title: t("assignedSuccess"), description: t("assignedDescription") });
    } else {
      toast({ title: t("error"), description: t("couldNotAssign"), variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "resolved") {
      setResolveDialogOpen(true);
      return;
    }
    const success = await updateStatus(newStatus as "unread" | "in_progress");
    if (success) {
      toast({ title: t("statusUpdated") });
    } else {
      toast({ title: t("error"), description: t("couldNotUpdateStatus"), variant: "destructive" });
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    setSubmittingUpdate(true);
    const success = await addUpdate(newUpdate.trim());
    if (success) {
      setNewUpdate("");
      toast({ title: t("updateAdded") });
    } else {
      toast({ title: t("error"), description: t("couldNotAddUpdate"), variant: "destructive" });
    }
    setSubmittingUpdate(false);
  };

  const handleResolve = async (details: {
    problem: string;
    fix: string;
    verification: string;
    testedOn: string[];
  }) => {
    const success = await resolve(details);
    if (success) {
      toast({ title: t("issueResolved"), description: t("resolvedDescription") });
    } else {
      toast({ title: t("error"), description: t("couldNotResolve"), variant: "destructive" });
    }
    return success;
  };

  const handleGenerateFixPlan = async () => {
    if (!message?.payload) return;
    
    if (!aiContext) {
      toast({ 
        title: "No AI context", 
        description: "This report doesn't have AI context data.", 
        variant: "destructive" 
      });
      return;
    }

    const prompt = `## Bug Report Context

**Route:** ${aiContext.route || 'Unknown'}
**User Role:** ${aiContext.user_role || 'Unknown'}
**Device:** ${aiContext.device || 'Unknown'}
**Browser:** ${aiContext.browser || 'Unknown'}

**User's Note:**
"${aiContext.user_note || 'No description provided'}"

**Recent Errors on this route:**
${aiContext.recent_errors?.length > 0 
  ? aiContext.recent_errors.map((e: any) => `- "${e.message}" (${new Date(e.timestamp).toLocaleString()})`).join('\n')
  : '- No recent errors logged'}

**Timestamp:** ${aiContext.timestamp || 'Unknown'}

---

Please analyze this bug report and provide:
1. Likely root cause
2. Affected components/files
3. Step-by-step fix plan
4. Test cases to verify the fix`;

    try {
      await navigator.clipboard.writeText(prompt);
      toast({ 
        title: "🧠 Fix plan prompt copied!", 
        description: "Paste it into ChatGPT or Claude to generate analysis." 
      });
    } catch (err) {
      console.log('--- FIX PLAN PROMPT ---');
      console.log(prompt);
      toast({ 
        title: "Prompt logged to console", 
        description: "Check browser console (clipboard failed)." 
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {t("priorityCritical")}
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("priorityHigh")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{t("priorityNormal")}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unread":
        return <Mail className="h-4 w-4 text-primary" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout title={t("loading")} description="">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!message) {
    return (
      <AdminLayout title={t("messageNotFound")} description="">
        <Button variant="outline" onClick={() => navigate("/admin/inbox")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToInbox")}
        </Button>
      </AdminLayout>
    );
  }

  const isResolved = message.status === "resolved";
  const resolutionLanguage = (message.resolution_details as { language?: InboxLanguage })?.language;
  const isContextualReport = message.type === 'contextual_report';

  return (
    <AdminLayout title={message.title} description={message.summary || ""}>
      {/* Header with back button and language selector */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/inbox")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <InboxLanguageSelector language={language} onLanguageChange={setLanguage} />
      </div>

      {/* Role mismatch banner - prominent at top */}
      {hasRoleMismatch && (
        <Alert variant="default" className="mb-4 border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm">
            <strong>Role mismatch:</strong> Issue reported by <Badge variant="outline" className="mx-1">{reportUserRole}</Badge> user. 
            You're logged in as <Badge variant="outline" className="mx-1">{currentUserRole}</Badge>.
            <span className="text-muted-foreground ml-2">Use repro link to see as user did.</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content with tabs */}
        <div className="lg:col-span-2 space-y-6">
          {isContextualReport ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="debug" className="gap-2">
                  <Bug className="h-4 w-4" />
                  Debug & Repro
                </TabsTrigger>
                <TabsTrigger value="health" className="gap-2">
                  <Gauge className="h-4 w-4" />
                  Route Health
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <OverviewContent
                  message={message}
                  isResolved={isResolved}
                  resolutionLanguage={resolutionLanguage}
                  language={language}
                  dateLocale={dateLocale}
                  t={t}
                  getStatusIcon={getStatusIcon}
                  getPriorityBadge={getPriorityBadge}
                />
              </TabsContent>

              {/* Debug & Repro Tab */}
              <TabsContent value="debug" className="space-y-4 mt-4">
                <DebugContent
                  aiContext={aiContext}
                  reproUrl={reproUrl}
                  handleOpenRepro={handleOpenRepro}
                  handleOpenReproNewTab={handleOpenReproNewTab}
                  handleCopyReproLink={handleCopyReproLink}
                  handleGenerateFixPlan={handleGenerateFixPlan}
                />
              </TabsContent>

              {/* Route Health Tab */}
              <TabsContent value="health" className="space-y-4 mt-4">
                <RouteHealthContent
                  routeErrors={routeErrors}
                  loadingErrors={loadingErrors}
                  reportRoute={reportRoute}
                  fetchRouteErrors={fetchRouteErrors}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* Non-contextual reports get standard view */
            <OverviewContent
              message={message}
              isResolved={isResolved}
              resolutionLanguage={resolutionLanguage}
              language={language}
              dateLocale={dateLocale}
              t={t}
              getStatusIcon={getStatusIcon}
              getPriorityBadge={getPriorityBadge}
            />
          )}

          {/* Timeline - always visible */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update) => (
                  <TimelineItem
                    key={update.id}
                    update={update}
                    viewerLanguage={language}
                    dateLocale={dateLocale}
                    t={t}
                  />
                ))}

                {/* Add update form */}
                {!isResolved && (
                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={t("addUpdatePlaceholder")}
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddUpdate}
                        disabled={!newUpdate.trim() || submittingUpdate}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {submittingUpdate ? t("sending") : t("addUpdate")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions & Info */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isResolved && (
                <>
                  {!message.assigned_to && (
                    <Button className="w-full" onClick={handleAssign}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t("assignToMe")}
                    </Button>
                  )}

                  <Select
                    value={message.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("changeStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">{t("statusUnread")}</SelectItem>
                      <SelectItem value="in_progress">{t("statusInProgress")}</SelectItem>
                      <SelectItem value="resolved">{t("statusResolved")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setResolveDialogOpen(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t("resolveProblem")}
                  </Button>
                </>
              )}

              {isResolved && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("resolvedBy")} {message.resolved_by_profile?.full_name || t("unknown")}
                    <br />
                    {message.resolved_at &&
                      format(new Date(message.resolved_at), "d MMM yyyy HH:mm", { locale: dateLocale })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("type")}</span>
                <span>{message.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("created")}</span>
                <span>{format(new Date(message.created_at), "d MMM yyyy HH:mm", { locale: dateLocale })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("updated")}</span>
                <span>{format(new Date(message.updated_at), "d MMM yyyy HH:mm", { locale: dateLocale })}</span>
              </div>
              {message.assigned_profile && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("assigned")}</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={message.assigned_profile.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {message.assigned_profile.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{message.assigned_profile.full_name}</span>
                  </div>
                </div>
              )}
              {message.payload?.check_count && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("checks")}</span>
                  <span className="text-yellow-600">{String(message.payload.check_count)} {t("times")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ResolveInboxDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        onResolve={handleResolve}
        language={language}
      />
    </AdminLayout>
  );
}

// ============ Sub-components ============

interface OverviewContentProps {
  message: any;
  isResolved: boolean;
  resolutionLanguage: InboxLanguage | undefined;
  language: InboxLanguage;
  dateLocale: Locale;
  t: (key: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getPriorityBadge: (priority: string) => React.ReactNode;
}

function OverviewContent({
  message,
  isResolved,
  resolutionLanguage,
  language,
  dateLocale,
  t,
  getStatusIcon,
  getPriorityBadge,
}: OverviewContentProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(message.status)}
              <CardTitle>{message.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityBadge(message.priority)}
              <span className="text-sm text-muted-foreground">
                {t("created")}{" "}
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {message.summary && (
          <p className="text-muted-foreground mb-4">{message.summary}</p>
        )}

        {/* Payload details */}
        {message.payload && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">{t("details")}</h4>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(message.payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Resolution details if resolved */}
        {isResolved && message.resolution_details && (
          <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <h4 className="font-medium">{t("resolved")}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong>{t("problemWas")}</strong>{" "}
                <LanguageAwareText
                  text={(message.resolution_details as { problem?: string }).problem || ""}
                  contentLanguage={resolutionLanguage}
                  viewerLanguage={language}
                />
              </p>
              <p>
                <strong>{t("weFixedBy")}</strong>{" "}
                <LanguageAwareText
                  text={(message.resolution_details as { fix?: string }).fix || ""}
                  contentLanguage={resolutionLanguage}
                  viewerLanguage={language}
                />
              </p>
              <p>
                <strong>{t("nowWorking")}</strong>{" "}
                <LanguageAwareText
                  text={(message.resolution_details as { verification?: string }).verification || ""}
                  contentLanguage={resolutionLanguage}
                  viewerLanguage={language}
                />
              </p>
              <p>
                <strong>{t("testedOn")}</strong>{" "}
                {((message.resolution_details as { testedOn?: string[] }).testedOn || []).join(", ")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DebugContentProps {
  aiContext: any;
  reproUrl: string | null;
  handleOpenRepro: () => void;
  handleOpenReproNewTab: () => void;
  handleCopyReproLink: () => void;
  handleGenerateFixPlan: () => void;
}

function DebugContent({
  aiContext,
  reproUrl,
  handleOpenRepro,
  handleOpenReproNewTab,
  handleCopyReproLink,
  handleGenerateFixPlan,
}: DebugContentProps) {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-amber-500" />
            Repro Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reproUrl ? (
            <>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                onClick={handleOpenRepro}
              >
                <Play className="h-4 w-4 mr-2" />
                Open page (repro mode)
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleOpenReproNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  New tab
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyReproLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </Button>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={handleGenerateFixPlan}
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate fix plan prompt
              </Button>

              <p className="text-xs text-muted-foreground">
                Opens the exact route with debug mode enabled
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No repro URL available for this issue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Context Info */}
      {aiContext && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Route</div>
              <div className="font-mono text-xs break-all">{aiContext.route || 'Unknown'}</div>
              
              <div className="text-muted-foreground">User Role</div>
              <div><Badge variant="outline">{aiContext.user_role || 'Unknown'}</Badge></div>
              
              <div className="text-muted-foreground">Device</div>
              <div>{aiContext.device || 'Unknown'}</div>
              
              <div className="text-muted-foreground">Timestamp</div>
              <div className="text-xs">{aiContext.timestamp ? format(new Date(aiContext.timestamp), 'PPpp') : 'Unknown'}</div>
            </div>

            {aiContext.user_note && (
              <div className="pt-2 border-t">
                <div className="text-muted-foreground mb-1">User Note</div>
                <p className="text-sm bg-muted p-2 rounded">{aiContext.user_note}</p>
              </div>
            )}

            {aiContext.recent_errors?.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-muted-foreground mb-2">Errors at time of report</div>
                <div className="space-y-1">
                  {aiContext.recent_errors.slice(0, 5).map((err: any, i: number) => (
                    <div key={i} className="text-xs bg-red-500/10 p-2 rounded font-mono">
                      {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RouteHealthContentProps {
  routeErrors: any[];
  loadingErrors: boolean;
  reportRoute: string | undefined;
  fetchRouteErrors: () => void;
}

function RouteHealthContent({
  routeErrors,
  loadingErrors,
  reportRoute,
  fetchRouteErrors,
}: RouteHealthContentProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Route: {reportRoute || 'Unknown'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchRouteErrors} disabled={loadingErrors}>
            {loadingErrors ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingErrors ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : routeErrors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No errors in last 24 hours</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {routeErrors.map((error) => (
                <div
                  key={error.id}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="destructive" className="text-xs">
                      {error.error_type || 'Error'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-mono truncate">{error.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          Showing errors from last 24 hours for this route
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineItemProps {
  update: InboxUpdate;
  viewerLanguage: InboxLanguage;
  dateLocale: Locale;
  t: (key: string) => string;
}

function TimelineItem({ update, viewerLanguage, dateLocale, t }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        {update.is_system ? (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarImage src={update.author_profile?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {update.is_system
              ? t("system")
              : update.author_profile?.full_name || t("unknown")}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(update.created_at), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        </div>
        <LanguageAwareText
          text={update.update_text}
          contentLanguage={update.language}
          viewerLanguage={viewerLanguage}
          className="text-sm text-muted-foreground"
        />
      </div>
    </div>
  );
}