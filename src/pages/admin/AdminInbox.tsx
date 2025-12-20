import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInboxMessages, InboxMessage } from "@/hooks/useInboxMessages";
import { useInboxLanguage } from "@/hooks/useInboxLanguage";
import { InboxLanguageSelector } from "@/components/admin/InboxLanguageSelector";
import { getKeyLabel } from "@/components/admin/AssignmentDropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Users,
} from "lucide-react";
import { formatDistanceToNow, Locale } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminInbox() {
  const [activeTab, setActiveTab] = useState<"all" | "qa">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [testingTelegram, setTestingTelegram] = useState(false);
  const { language, setLanguage, t } = useInboxLanguage();

  // QA tab always enforces: type = 'contextual_report', excludeResolved = true
  const isQaTab = activeTab === "qa";

  const { messages, loading, unreadCount, inProgressCount, qaCount } = useInboxMessages({
    status: statusFilter as "unread" | "in_progress" | "resolved" | "all",
    priority: priorityFilter as "critical" | "high" | "normal" | "all",
    type: isQaTab ? "contextual_report" : undefined,
    excludeResolved: isQaTab ? true : undefined,
  });

  const dateLocale = language === "sv" ? sv : enUS;

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    console.log('[Telegram Test] Starting test...');
    
    try {
      const payload = {
        inbox_id: 'VERIFY_TEST',
        title: 'VERIFY_TELEGRAM_OK',
        route: '/admin/inbox',
        user_role: 'admin',
        user_note: 'Test notification from admin panel',
        timestamp: new Date().toISOString(),
      };
      
      console.log('[Telegram Test] Sending payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: payload,
      });
      
      console.log('[Telegram Test] Response - data:', data, 'error:', error);
      
      if (error) {
        console.error('[Telegram Test] Edge function error:', error);
        toast.error(`Telegram test failed: ${error.message}`);
        return;
      }
      
      if (data?.ok) {
        toast.success(`Telegram test successful! Message ID: ${data.message_id}${data.warning ? ` ⚠️ ${data.warning}` : ''}`);
        if (data.used_migrated_chat_id) {
          console.warn('[Telegram Test] MIGRATION: Update TELEGRAM_CHAT_ID to', data.used_migrated_chat_id);
        }
      } else if (data?.skipped) {
        toast.info(`Telegram notifications disabled (BUG_NOTIFICATIONS_ENABLED=${data.reason})`);
      } else {
        toast.error(`Telegram test failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('[Telegram Test] Network error:', err);
      toast.error(`Network error: ${err.message}`);
    } finally {
      setTestingTelegram(false);
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
        return <MailOpen className="h-4 w-4" />;
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

  // For QA tab, disable "resolved" and "verified" options in status filter
  const getStatusOptions = () => {
    const options = [
      { value: "all", label: t("allStatuses") },
      { value: "unread", label: t("unreadStatus") },
      { value: "in_progress", label: t("inProgressStatus") },
    ];
    
    // Only show resolved/verified options in All tab
    if (!isQaTab) {
      options.push({ value: "resolved", label: t("resolvedStatus") });
      options.push({ value: "verified", label: "Verified ✓" });
    }
    
    return options;
  };

  // Reset status filter when switching to QA tab if it's set to "resolved" or "verified"
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "all" | "qa");
    if (tab === "qa" && (statusFilter === "resolved" || statusFilter === "verified")) {
      setStatusFilter("all");
    }
  };

  return (
    <AdminLayout title={t("inbox")} description={t("inboxDescription")}>
      {/* Language selector + Stats bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{unreadCount} {t("unread")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{inProgressCount} {t("inProgress")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            className="gap-2"
          >
            {testingTelegram ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Test Telegram
          </Button>
          <InboxLanguageSelector language={language} onLanguageChange={setLanguage} />
        </div>
      </div>

      {/* Tabs: All / QA */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="qa" className="gap-2">
            QA
            {qaCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {qaCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {getStatusOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("allPriorities")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allPriorities")}</SelectItem>
            <SelectItem value="critical">{t("critical")}</SelectItem>
            <SelectItem value="high">{t("high")}</SelectItem>
            <SelectItem value="normal">{t("normal")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </Card>
          ))
        ) : messages.length === 0 ? (
          <Card className="p-8 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">{t("noMessages")}</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? t("noMessagesFiltered")
                : isQaTab
                ? "No open QA issues"
                : t("allResolved")}
            </p>
          </Card>
        ) : (
          messages.map((message) => (
            <InboxMessageCard
              key={message.id}
              message={message}
              dateLocale={dateLocale}
              getPriorityBadge={getPriorityBadge}
              getStatusIcon={getStatusIcon}
              t={t}
            />
          ))
        )}
      </div>
    </AdminLayout>
  );
}

interface InboxMessageCardProps {
  message: InboxMessage;
  dateLocale: Locale;
  getPriorityBadge: (priority: string) => React.ReactNode;
  getStatusIcon: (status: string) => React.ReactNode;
  t: (key: string) => string;
}

function InboxMessageCard({
  message,
  dateLocale,
  getPriorityBadge,
  getStatusIcon,
  t,
}: InboxMessageCardProps) {
  return (
    <Link to={`/admin/inbox/${message.id}`}>
      <Card
        className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
          message.status === "unread" ? "border-l-4 border-l-primary" : ""
        } ${
          message.status === "verified" ? "border-l-4 border-l-emerald-500 bg-emerald-500/5" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {getStatusIcon(message.status)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className={`font-medium truncate ${
                  message.status === "unread" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {message.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getPriorityBadge(message.priority)}
                {message.status === "verified" && (
                  <Badge className="bg-emerald-500 text-white border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {message.summary && (
              <p className="text-sm text-muted-foreground truncate mb-2">
                {message.summary}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span>
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>

              {/* Show assignee: user profile OR team key OR unassigned */}
              {message.assigned_profile ? (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={message.assigned_profile.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {message.assigned_profile.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{message.assigned_profile.full_name || t("assigned")}</span>
                </div>
              ) : message.assigned_key ? (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{getKeyLabel(message.assigned_key)}</span>
                </div>
              ) : null}

              {message.payload?.check_count && (
                <span className="text-yellow-600">
                  {t("checks")} {String(message.payload.check_count)} {t("times")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
