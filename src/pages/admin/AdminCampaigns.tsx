import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Megaphone, Users, Trophy, Pause, Play, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Campaign {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  is_paused: boolean;
  admin_notes: string | null;
  entry_count?: number;
  vote_count?: number;
}

export default function AdminCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data: campaignsData, error } = await supabase
        .from("spotlight_campaigns")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      // Get entry and vote counts for each campaign
      const campaignsWithStats = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { count: entryCount } = await supabase
            .from("spotlight_entries")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id);

          const { data: entries } = await supabase
            .from("spotlight_entries")
            .select("total_votes")
            .eq("campaign_id", campaign.id);

          const voteCount = entries?.reduce((sum, e) => sum + (e.total_votes || 0), 0) || 0;

          return {
            ...campaign,
            entry_count: entryCount || 0,
            vote_count: voteCount,
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const togglePause = async (campaign: Campaign) => {
    if (!user) return;

    try {
      const newPausedState = !campaign.is_paused;
      const { error } = await supabase
        .from("spotlight_campaigns")
        .update({ is_paused: newPausedState })
        .eq("id", campaign.id);

      if (error) throw error;

      // Log activity
      await (supabase.from("admin_activity_logs") as any).insert({
        admin_id: user.id,
        action: newPausedState ? "campaign_pause" : "campaign_resume",
        target_type: "spotlight_campaign",
        target_id: campaign.id,
        details: { name: campaign.name },
      });

      toast.success(`Campaign ${newPausedState ? "paused" : "resumed"}`);
      fetchCampaigns();
    } catch (error) {
      console.error("Error toggling pause:", error);
      toast.error("Failed to update campaign");
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedCampaign || !user) return;

    try {
      const { error } = await supabase
        .from("spotlight_campaigns")
        .update({ admin_notes: adminNotes })
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      toast.success("Notes saved");
      setSelectedCampaign(null);
      setAdminNotes("");
      fetchCampaigns();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const getStatusBadge = (campaign: Campaign) => {
    if (campaign.is_paused) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Paused</Badge>;
    }
    switch (campaign.status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500/20 text-blue-400">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{campaign.status}</Badge>;
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "paused") return c.is_paused;
    return c.status === activeTab && !c.is_paused;
  });

  return (
    <AdminLayout title="Campaign Oversight" description="Monitor and manage Spotlight campaigns">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active ({campaigns.filter(c => c.status === "active" && !c.is_paused).length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({campaigns.filter(c => c.is_paused).length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <p className="text-muted-foreground">Loading campaigns...</p>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className={campaign.is_paused ? "border-yellow-500/50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        {campaign.name}
                      </CardTitle>
                      {getStatusBadge(campaign)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{campaign.entry_count} entries</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span>{campaign.vote_count} votes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {campaign.admin_notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                        <p className="text-muted-foreground">Notes: {campaign.admin_notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/spotlight/${campaign.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Entries
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePause(campaign)}
                      >
                        {campaign.is_paused ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setAdminNotes(campaign.admin_notes || "");
                        }}
                      >
                        Add Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notes Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Notes</DialogTitle>
            <DialogDescription>Add admin notes for {selectedCampaign?.name}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Internal notes about this campaign..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCampaign(null)}>Cancel</Button>
            <Button onClick={saveAdminNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
