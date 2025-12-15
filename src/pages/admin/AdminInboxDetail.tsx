import { useState } from "react";
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
  CheckCircle2,
  Clock,
  Mail,
  Send,
  User,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow, format, Locale } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { InboxLanguage } from "@/i18n/inbox";

export default function AdminInboxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useInboxLanguage();
  
  const { message, updates, loading, assignToMe, updateStatus, addUpdate, resolve } =
    useInboxMessage(id || "", language);

  const [newUpdate, setNewUpdate] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const dateLocale = language === "sv" ? sv : enUS;

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

        {/* Sidebar */}
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
