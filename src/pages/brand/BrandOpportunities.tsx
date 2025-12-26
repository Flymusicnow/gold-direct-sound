import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrandLayout } from "@/components/brand/BrandLayout";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Briefcase, Calendar, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  location: string | null;
  budget_range: string | null;
  application_deadline: string | null;
  is_active: boolean;
  created_at: string;
}

const OPPORTUNITY_TYPES = [
  { value: "live_event", label: "Live Event" },
  { value: "festival_slot", label: "Festival Slot" },
  { value: "brand_campaign", label: "Brand Campaign" },
  { value: "sponsored_content", label: "Sponsored Content" },
  { value: "brand_ambassador", label: "Brand Ambassador" },
];

export default function BrandOpportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    location: "",
    budgetRange: "",
    deadline: "",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Get brand entity ID
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) return;

      setEntityId(adminData.collab_entity_id);

      // Get opportunities
      const { data: opps } = await supabase
        .from("collab_opportunities")
        .select("*")
        .eq("collab_entity_id", adminData.collab_entity_id)
        .order("created_at", { ascending: false });

      if (opps) {
        setOpportunities(opps);
      }
    } catch (error) {
      console.error("Error loading opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!entityId || !formData.title || !formData.type) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase.from("collab_opportunities").insert({
        collab_entity_id: entityId,
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        location: formData.location || null,
        budget_range: formData.budgetRange || null,
        application_deadline: formData.deadline || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Opportunity created!");
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        type: "",
        location: "",
        budgetRange: "",
        deadline: "",
      });
      loadData();
    } catch (error: any) {
      console.error("Error creating opportunity:", error);
      toast.error(error.message || "Failed to create opportunity");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("collab_opportunities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Opportunity deleted");
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast.error("Failed to delete opportunity");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("collab_opportunities")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, is_active: !isActive } : o))
      );
      toast.success(isActive ? "Opportunity paused" : "Opportunity activated");
    } catch (error) {
      console.error("Error toggling opportunity:", error);
      toast.error("Failed to update opportunity");
    }
  };

  if (loading) {
    return (
      <BrandLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="flex w-full">
        <BrandSidebar />

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Opportunities</h1>
                <p className="text-muted-foreground">
                  Create and manage partnership opportunities
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-gold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Opportunity
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Opportunity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Summer Festival Opening Act"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select opportunity type" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPPORTUNITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the opportunity..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="City, Country"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, location: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget Range</Label>
                        <Input
                          id="budget"
                          placeholder="e.g., 5,000-10,000 SEK"
                          value={formData.budgetRange}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, budgetRange: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Application Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                        }
                      />
                    </div>

                    <Button onClick={handleCreate} className="w-full bg-gradient-gold">
                      Create Opportunity
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Opportunities List */}
            {opportunities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No opportunities yet. Create your first one!
                  </p>
                  <Button onClick={() => setDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Opportunity
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <Card key={opp.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{opp.title}</h3>
                            <Badge variant={opp.is_active ? "default" : "secondary"}>
                              {opp.is_active ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          {opp.description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {opp.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {OPPORTUNITY_TYPES.find((t) => t.value === opp.type)?.label ||
                                opp.type}
                            </span>
                            {opp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {opp.location}
                              </span>
                            )}
                            {opp.application_deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Deadline: {format(new Date(opp.application_deadline), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(opp.id, opp.is_active)}
                          >
                            {opp.is_active ? "Pause" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(opp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </BrandLayout>
  );
}
