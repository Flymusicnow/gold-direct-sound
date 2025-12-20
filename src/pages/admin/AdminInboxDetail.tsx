import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInboxMessage, InboxUpdate } from "@/hooks/useInboxMessages";
import { useInboxLanguage } from "@/hooks/useInboxLanguage";
import { InboxLanguageSelector } from "@/components/admin/InboxLanguageSelector";
import { LanguageAwareText } from "@/components/admin/LanguageAwareText";
import { ResolveInboxDialog } from "@/components/admin/ResolveInboxDialog";
import { QuickResolveDialog } from "@/components/admin/QuickResolveDialog";
import { AssignmentDropdown, getKeyLabel } from "@/components/admin/AssignmentDropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  Play,
  Send,
  User,
  Users,
} from "lucide-react";
import { formatDistanceToNow, format, Locale } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { InboxLanguage } from "@/i18n/inbox";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminInboxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useInboxLanguage();
  const { userRoles } = useAuth();
  
  const { message, updates, loading, assignToMe, assignToKey, unassign, updateStatus, addUpdate, resolve } =
    useInboxMessage(id || "", language);

  const [newUpdate, setNewUpdate] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [quickResolveOpen, setQuickResolveOpen] = useState(false);
  const [advancedResolveOpen, setAdvancedResolveOpen] = useState(false);

  const dateLocale = language === "sv" ? sv : enUS;

  // Build repro URL for contextual reports
  const buildReproUrl = () => {
    if (!message?.payload) return null;
    const aiContext = (message.payload as { ai_context?: any }).ai_context;
    if (!aiContext?.route) return null;
    
    const origin = window.location.origin;
    const route = aiContext.route;
    const reportId = aiContext.report_id || message.id;
    return `${origin}${route}?__issue=${reportId}&__repro=1`;
  };

  // Build verification URL for testing fix
  const buildVerifyUrl = () => {
    if (!message?.payload) return null;
    const aiContext = (message.payload as { ai_context?: any }).ai_context;
    if (!aiContext?.route) return null;
    
    const origin = window.location.origin;
    const route = aiContext.route;
    return `${origin}${route}?__issue=${message.id}&__verify=1`;
  };

  const reproUrl = message?.type === 'contextual_report' ? buildReproUrl() : null;
  const verifyUrl = message?.type === 'contextual_report' ? buildVerifyUrl() : null;
  const aiContext = message?.payload ? (message.payload as { ai_context?: any }).ai_context : null;
  const reportUserRole = aiContext?.user_role;
  const currentUserRole = userRoles?.[0] || 'admin';
  const hasRoleMismatch = reportUserRole && reportUserRole !== currentUserRole && reportUserRole !== 'admin';

  const handleOpenVerify = () => {
    if (verifyUrl) {
      window.open(verifyUrl, '_blank', 'noopener,noreferrer');
    }
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
    return success;
  };

  const handleAssignToKey = async (key: string) => {
    const success = await assignToKey(key);
    if (success) {
      toast({ title: `Assigned to ${getKeyLabel(key)}` });
    } else {
      toast({ title: t("error"), description: t("couldNotAssign"), variant: "destructive" });
    }
    return success;
  };

  const handleUnassign = async () => {
    const success = await unassign();
    if (success) {
      toast({ title: "Unassigned" });
    } else {
      toast({ title: t("error"), description: "Could not unassign", variant: "destructive" });
    }
    return success;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "resolved") {
      setQuickResolveOpen(true);
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
    
    const aiContext = (message.payload as { ai_context?: any }).ai_context;
    if (!aiContext) {
      toast({ 
        title: "No AI context", 
        description: "This report doesn't have AI context data.", 
        variant: "destructive" 
      });
      return;
    }

    // Format the prompt
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
      // Fallback: show in console
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
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
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
  const isVerified = message.status === "verified";
  const isClosed = isResolved || isVerified;
  const resolutionLanguage = (message.resolution_details as { language?: InboxLanguage })?.language;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message header */}
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

          {/* Timeline */}
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
                {!isClosed && (
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Generate fix plan - only for contextual_report type */}
              {message.type === 'contextual_report' && (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={handleGenerateFixPlan}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  🧠 Generate fix plan
                </Button>
              )}
              
              {!isClosed && (
                <>
                  {/* TEST FIX BUTTON - Primary action for verification */}
                  {message.type === 'contextual_report' && verifyUrl && (
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      onClick={handleOpenVerify}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Test Fix on Affected Page
                    </Button>
                  )}

                  {/* Assignment dropdown with split-button */}
                  <AssignmentDropdown
                    onAssignToMe={handleAssign}
                    onAssignToKey={handleAssignToKey}
                    onUnassign={handleUnassign}
                    currentAssignedTo={message.assigned_to}
                    currentAssignedKey={message.assigned_key}
                    className="w-full"
                  />

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
                      {/* Verified is NOT manually selectable */}
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setQuickResolveOpen(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t("quickResolve")}
                  </Button>
                </>
              )}

              {/* Verified status display */}
              {isVerified && (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-medium text-emerald-600">System Verified</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      ✓ Verified on <span className="font-mono">{message.verified_route}</span>
                    </p>
                    <p>
                      Device: {message.verified_device}
                    </p>
                    <p>
                      By: {message.verified_by_profile?.full_name || t("unknown")}
                    </p>
                    {message.verified_at && (
                      <p>
                        {format(new Date(message.verified_at), "d MMM yyyy HH:mm", { locale: dateLocale })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resolved status display */}
              {isResolved && !isVerified && (
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

          {/* Developer Tools - Only for contextual_report */}
          {message.type === 'contextual_report' && reproUrl && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="h-4 w-4 text-amber-500" />
                  Developer Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Role Warning */}
                {hasRoleMismatch && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2 text-xs">
                    <span className="text-yellow-600 font-medium">⚠️ Role mismatch:</span>
                    <span className="text-muted-foreground"> Issue reported by </span>
                    <Badge variant="outline" className="text-xs">{reportUserRole}</Badge>
                    <span className="text-muted-foreground"> — you are </span>
                    <Badge variant="outline" className="text-xs">{currentUserRole}</Badge>
                  </div>
                )}

                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={handleOpenRepro}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Open page (repro)
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenReproNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyReproLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy repro link
                </Button>

                <p className="text-xs text-muted-foreground">
                  Opens the exact route where the issue was reported with debug mode enabled.
                </p>
              </CardContent>
            </Card>
          )}

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
              {/* Show assigned user OR team key */}
              {(message.assigned_to || message.assigned_key) && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("assigned")}</span>
                  <div className="flex items-center gap-2">
                    {message.assigned_profile ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={message.assigned_profile.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {message.assigned_profile.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{message.assigned_profile.full_name}</span>
                      </>
                    ) : message.assigned_key ? (
                      <>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{getKeyLabel(message.assigned_key)}</span>
                      </>
                    ) : null}
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

      <QuickResolveDialog
        open={quickResolveOpen}
        onOpenChange={setQuickResolveOpen}
        onResolve={handleResolve}
        language={language}
        issueTitle={message?.title}
        issueRoute={(message?.payload as any)?.ai_context?.route}
        onAdvancedClick={() => setAdvancedResolveOpen(true)}
      />

      <ResolveInboxDialog
        open={advancedResolveOpen}
        onOpenChange={setAdvancedResolveOpen}
        onResolve={handleResolve}
        language={language}
      />
    </AdminLayout>
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
