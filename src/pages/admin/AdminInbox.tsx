import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInboxMessages, InboxMessage } from "@/hooks/useInboxMessages";
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
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  MailOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

export default function AdminInbox() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { messages, loading, unreadCount, inProgressCount } = useInboxMessages({
    status: statusFilter as "unread" | "in_progress" | "resolved" | "all",
    priority: priorityFilter as "critical" | "high" | "normal" | "all",
  });

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "unread":
        return "Oläst";
      case "in_progress":
        return "Pågående";
      case "resolved":
        return "Löst";
      default:
        return status;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Kritisk
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hög
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">Normal</Badge>
        );
    }
  };

  return (
    <AdminLayout title="Inbox" description="Hantera QA-problem och systemmeddelanden">
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
          <Mail className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{unreadCount} olästa</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{inProgressCount} pågående</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="unread">Olästa</SelectItem>
            <SelectItem value="in_progress">Pågående</SelectItem>
            <SelectItem value="resolved">Lösta</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Prioritet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla prioriteter</SelectItem>
            <SelectItem value="critical">Kritisk</SelectItem>
            <SelectItem value="high">Hög</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
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
            <h3 className="font-medium mb-1">Inga meddelanden</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? "Inga meddelanden matchar dina filter"
                : "Alla QA-problem har lösts!"}
            </p>
          </Card>
        ) : (
          messages.map((message) => (
            <InboxMessageCard key={message.id} message={message} />
          ))
        )}
      </div>
    </AdminLayout>
  );
}

function InboxMessageCard({ message }: { message: InboxMessage }) {
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
            Kritisk
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hög
          </Badge>
        );
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

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
                  locale: sv,
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
                  <span>{message.assigned_profile.full_name || "Tilldelad"}</span>
                </div>
              )}

              {message.payload?.check_count && (
                <span className="text-yellow-600">
                  Kontrollerat {String(message.payload.check_count)} gånger
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
