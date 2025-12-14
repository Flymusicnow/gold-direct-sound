import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInboxMessage, InboxUpdate } from "@/hooks/useInboxMessages";
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
import { formatDistanceToNow, format } from "date-fns";
import { sv } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AdminInboxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { message, updates, loading, assignToMe, updateStatus, addUpdate, resolve } =
    useInboxMessage(id || "");

  const [newUpdate, setNewUpdate] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const handleAssign = async () => {
    const success = await assignToMe();
    if (success) {
      toast({ title: "Tilldelad", description: "Du har tilldelat dig själv detta ärende" });
    } else {
      toast({ title: "Fel", description: "Kunde inte tilldela ärendet", variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "resolved") {
      setResolveDialogOpen(true);
      return;
    }
    const success = await updateStatus(newStatus as "unread" | "in_progress");
    if (success) {
      toast({ title: "Status uppdaterad" });
    } else {
      toast({ title: "Fel", description: "Kunde inte uppdatera status", variant: "destructive" });
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    setSubmittingUpdate(true);
    const success = await addUpdate(newUpdate.trim());
    if (success) {
      setNewUpdate("");
      toast({ title: "Uppdatering tillagd" });
    } else {
      toast({ title: "Fel", description: "Kunde inte lägga till uppdatering", variant: "destructive" });
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
      toast({ title: "Ärendet löst!", description: "Problemet har markerats som löst" });
    } else {
      toast({ title: "Fel", description: "Kunde inte lösa ärendet", variant: "destructive" });
    }
    return success;
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
      <AdminLayout title="Laddar..." description="">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!message) {
    return (
      <AdminLayout title="Meddelande hittades inte" description="">
        <Button variant="outline" onClick={() => navigate("/admin/inbox")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till Inbox
        </Button>
      </AdminLayout>
    );
  }

  const isResolved = message.status === "resolved";

  return (
    <AdminLayout title={message.title} description={message.summary || ""}>
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/inbox")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka
      </Button>

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
                      Skapad{" "}
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: sv,
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
                  <h4 className="font-medium text-sm">Detaljer</h4>
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
                    <h4 className="font-medium">Löst</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Problemet var att:</strong>{" "}
                      {(message.resolution_details as { problem?: string }).problem}
                    </p>
                    <p>
                      <strong>Vi fixade det genom att:</strong>{" "}
                      {(message.resolution_details as { fix?: string }).fix}
                    </p>
                    <p>
                      <strong>Nu fungerar det eftersom:</strong>{" "}
                      {(message.resolution_details as { verification?: string }).verification}
                    </p>
                    <p>
                      <strong>Testat på:</strong>{" "}
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
              <CardTitle className="text-base">Tidslinje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update) => (
                  <TimelineItem key={update.id} update={update} />
                ))}

                {/* Add update form */}
                {!isResolved && (
                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Lägg till en uppdatering..."
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
                        {submittingUpdate ? "Skickar..." : "Lägg till"}
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
              <CardTitle className="text-base">Åtgärder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isResolved && (
                <>
                  {!message.assigned_to && (
                    <Button className="w-full" onClick={handleAssign}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tilldela mig
                    </Button>
                  )}

                  <Select
                    value={message.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ändra status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">Oläst</SelectItem>
                      <SelectItem value="in_progress">Pågående</SelectItem>
                      <SelectItem value="resolved">Löst</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setResolveDialogOpen(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Lös problemet
                  </Button>
                </>
              )}

              {isResolved && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Löst av {message.resolved_by_profile?.full_name || "okänd"}
                    <br />
                    {message.resolved_at &&
                      format(new Date(message.resolved_at), "d MMM yyyy HH:mm", { locale: sv })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Typ</span>
                <span>{message.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skapad</span>
                <span>{format(new Date(message.created_at), "d MMM yyyy HH:mm", { locale: sv })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uppdaterad</span>
                <span>{format(new Date(message.updated_at), "d MMM yyyy HH:mm", { locale: sv })}</span>
              </div>
              {message.assigned_profile && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tilldelad</span>
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
                  <span className="text-muted-foreground">Kontroller</span>
                  <span className="text-yellow-600">{String(message.payload.check_count)} gånger</span>
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
      />
    </AdminLayout>
  );
}

function TimelineItem({ update }: { update: InboxUpdate }) {
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
              ? "System"
              : update.author_profile?.full_name || "Okänd"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(update.created_at), {
              addSuffix: true,
              locale: sv,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{update.update_text}</p>
      </div>
    </div>
  );
}
