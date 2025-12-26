import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Mail, Phone, Globe, Calendar, CheckCircle, XCircle, Clock, MessageSquare, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BrandApplication {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  website: string | null;
  company_type: string;
  intended_use: string | null;
  campaign_goals: string | null;
  target_genres: string[];
  budget_range: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface CollabEntity {
  id: string;
  name: string;
  type: string;
}

export default function AdminBrandApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<BrandApplication[]>([]);
  const [existingEntities, setExistingEntities] = useState<CollabEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApp, setSelectedApp] = useState<BrandApplication | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "changes" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  useEffect(() => {
    fetchApplications();
    fetchExistingEntities();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("brand_applications") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingEntities = async () => {
    try {
      const { data, error } = await supabase
        .from("collab_entities")
        .select("id, name, type")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setExistingEntities(data || []);
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  };

  const sendStatusEmail = async (app: BrandApplication, status: string, notes?: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-brand-status-email", {
        body: {
          email: app.email,
          contactPerson: app.contact_person,
          companyName: app.company_name,
          status,
          adminNotes: notes,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const linkUserToExistingEntity = async (app: BrandApplication, entityId: string) => {
    // Find user by email
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", app.email)
      .single();

    if (profileData) {
      // Check if already linked
      const { data: existingAdmin } = await supabase
        .from("collab_entity_admins")
        .select("id")
        .eq("collab_entity_id", entityId)
        .eq("user_id", profileData.id)
        .single();

      if (!existingAdmin) {
        await supabase.from("collab_entity_admins").insert({
          collab_entity_id: entityId,
          user_id: profileData.id,
          role: "owner",
        });
      }
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedApp || !user) return;

    try {
      // If linking to existing entity, skip trigger by handling manually
      if (status === "approved" && selectedEntityId && selectedEntityId !== "auto") {
        // Link user to existing entity first
        await linkUserToExistingEntity(selectedApp, selectedEntityId);
        
        // Update status without triggering auto-create (by setting a flag in admin_notes)
        const { error } = await (supabase.from("brand_applications") as any)
          .update({
            status,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            admin_notes: adminNotes ? `[LINKED TO EXISTING ENTITY: ${selectedEntityId}] ${adminNotes}` : `[LINKED TO EXISTING ENTITY: ${selectedEntityId}]`,
          })
          .eq("id", selectedApp.id);

        if (error) throw error;
      } else {
        // Normal flow - let trigger handle entity creation
        const { error } = await (supabase.from("brand_applications") as any)
          .update({
            status,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            admin_notes: adminNotes || null,
          })
          .eq("id", selectedApp.id);

        if (error) throw error;
      }

      // Log activity
      await (supabase.from("admin_activity_logs") as any).insert({
        admin_id: user.id,
        action: `brand_application_${status}`,
        target_type: "brand_application",
        target_id: selectedApp.id,
        details: { 
          company_name: selectedApp.company_name, 
          notes: adminNotes,
          linked_entity_id: selectedEntityId && selectedEntityId !== "auto" ? selectedEntityId : null 
        },
      });

      // Send email notification
      const emailStatus = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "changes_requested";
      await sendStatusEmail(selectedApp, emailStatus, adminNotes);

      toast.success(`Application ${status}`);
      fetchApplications();
      setSelectedApp(null);
      setActionType(null);
      setAdminNotes("");
      setSelectedEntityId("");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "changes_requested":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Changes Requested</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const filteredApps = applications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  return (
    <AdminLayout title="Brand Applications" description="Manage partnership applications from brands and sponsors">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending ({applications.filter(a => a.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="changes_requested">Changes Requested</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <p className="text-muted-foreground">Loading applications...</p>
          ) : filteredApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {app.company_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{app.company_type}</p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Contact:</span>
                          {app.contact_person}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {app.email}
                        </p>
                        {app.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {app.phone}
                          </p>
                        )}
                        {app.website && (
                          <p className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={app.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                              {app.website}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        {app.budget_range && (
                          <p><span className="text-muted-foreground">Budget:</span> {app.budget_range}</p>
                        )}
                        {app.target_genres?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {app.target_genres.map((genre) => (
                              <Badge key={genre} variant="outline" className="text-xs">{genre}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {app.intended_use && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Intended Use:</p>
                        <p className="text-sm">{app.intended_use}</p>
                      </div>
                    )}

                    {app.campaign_goals && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Campaign Goals:</p>
                        <p className="text-sm">{app.campaign_goals}</p>
                      </div>
                    )}

                    {app.admin_notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Admin Notes:</p>
                        <p className="text-sm">{app.admin_notes}</p>
                      </div>
                    )}

                    {app.status === "pending" && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => { setSelectedApp(app); setActionType("approve"); }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setSelectedApp(app); setActionType("changes"); }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Changes
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => { setSelectedApp(app); setActionType("reject"); }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setAdminNotes(""); setSelectedEntityId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Application"}
              {actionType === "reject" && "Reject Application"}
              {actionType === "changes" && "Request Changes"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "This will approve the brand and send them access to the Brand Portal."}
              {actionType === "reject" && "This will reject the application. The applicant will be notified."}
              {actionType === "changes" && "Request additional information from the applicant."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "approve" && (
            <div className="space-y-2">
              <Label htmlFor="entity-select" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link to Entity
              </Label>
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger id="entity-select">
                  <SelectValue placeholder="Auto-create new entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-create new entity</SelectItem>
                  {existingEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name} ({entity.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedEntityId && selectedEntityId !== "auto" 
                  ? "User will be linked as owner to the selected entity. No new entity will be created."
                  : "A new collab entity will be created automatically from the application data."}
              </p>
            </div>
          )}

          <Textarea
            placeholder={actionType === "changes" ? "What information do you need?" : "Optional notes..."}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setAdminNotes(""); setSelectedEntityId(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const statusMap: Record<string, string> = {
                  approve: "approved",
                  reject: "rejected",
                  changes: "changes_requested"
                };
                updateStatus(statusMap[actionType!]);
              }}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : actionType === "reject" ? "bg-destructive" : ""}
            >
              {actionType === "approve" && "Approve & Notify"}
              {actionType === "reject" && "Reject & Notify"}
              {actionType === "changes" && "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
