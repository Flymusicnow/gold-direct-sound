import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, Plus, MoreVertical, Pencil, Trash2, Play, Pause, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SpotlightCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  banner_image_url: string | null;
  created_at: string;
}

const formatDateForInput = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 16);
};

export default function AdminSpotlight() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [campaigns, setCampaigns] = useState<SpotlightCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<SpotlightCampaign | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "upcoming",
    start_date: "",
    end_date: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    status: "upcoming",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/');
      return;
    }
    fetchCampaigns();
  }, [hasRole, navigate]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('spotlight_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Start and end dates are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      const { error } = await supabase
        .from('spotlight_campaigns')
        .insert([campaignData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign created successfully",
      });

      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        status: "upcoming",
        start_date: "",
        end_date: "",
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (campaign: SpotlightCampaign) => {
    setSelectedCampaign(campaign);
    setEditFormData({
      name: campaign.name,
      description: campaign.description || "",
      status: campaign.status,
      start_date: formatDateForInput(campaign.start_date),
      end_date: formatDateForInput(campaign.end_date),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return;

    if (!editFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!editFormData.start_date || !editFormData.end_date) {
      toast({
        title: "Error",
        description: "Start and end dates are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const campaignData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || null,
        status: editFormData.status,
        start_date: new Date(editFormData.start_date).toISOString(),
        end_date: new Date(editFormData.end_date).toISOString(),
      };

      const { error } = await supabase
        .from('spotlight_campaigns')
        .update(campaignData)
        .eq('id', selectedCampaign.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (campaign: SpotlightCampaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      const { error } = await supabase
        .from('spotlight_campaigns')
        .delete()
        .eq('id', selectedCampaign.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (campaign: SpotlightCampaign, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('spotlight_campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      upcoming: "secondary",
      active: "default",
      ended: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout title="FlyMusic Spotlight" description="Manage spotlight campaigns">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="FlyMusic Spotlight" description="Manage spotlight campaigns">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-foreground">Campaigns</span>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Spotlight Campaign</DialogTitle>
              <DialogDescription>
                Set up a new campaign for artists to submit tracks and fans to vote.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="FlyMusic Spotlight - Spring 2026"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Campaign description..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateCampaign}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle 
                  className="text-lg cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/admin/spotlight/${campaign.id}`)}
                >
                  {campaign.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(campaign.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/spotlight/${campaign.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Entries
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {campaign.status !== 'active' ? (
                        <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'active')}>
                          <Play className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'upcoming')}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(campaign)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardDescription>
                {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No campaigns yet. Create your first one!</p>
        </div>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update the campaign details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Campaign Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="FlyMusic Spotlight - Spring 2026"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Campaign description..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-start_date">Start Date *</Label>
              <Input
                id="edit-start_date"
                type="datetime-local"
                value={editFormData.start_date}
                onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-end_date">End Date *</Label>
              <Input
                id="edit-end_date"
                type="datetime-local"
                value={editFormData.end_date}
                onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCampaign}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign
              "{selectedCampaign?.name}" and all its entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
