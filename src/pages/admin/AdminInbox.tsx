import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInboxMessages, InboxMessage } from "@/hooks/useInboxMessages";
import { useInboxLanguage } from "@/hooks/useInboxLanguage";
import { InboxLanguageSelector } from "@/components/admin/InboxLanguageSelector";
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
} from "lucide-react";
import { formatDistanceToNow, Locale } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminInbox() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [testingTelegram, setTestingTelegram] = useState(false);
  const { language, setLanguage, t } = useInboxLanguage();

  const { messages, loading, unreadCount, inProgressCount } = useInboxMessages({
    status: statusFilter as "unread" | "in_progress" | "resolved" | "all",
    priority: priorityFilter as "critical" | "high" | "normal" | "all",
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

  return (
    <AdminLayout title={t("inbox")} description={t("inboxDescription")}>
      {/* Language selector + Stats bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="unread">{t("unreadStatus")}</SelectItem>
            <SelectItem value="in_progress">{t("inProgressStatus")}</SelectItem>
            <SelectItem value="resolved">{t("resolvedStatus")}</SelectItem>
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
              </div>
            </div>

            {message.summary && (
              <p className="text-sm text-muted-foreground truncate mb-2">
                {message.summary}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>

              {message.assigned_profile && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={message.assigned_profile.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {message.assigned_profile.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{message.assigned_profile.full_name || t("assigned")}</span>
                </div>
              )}

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
