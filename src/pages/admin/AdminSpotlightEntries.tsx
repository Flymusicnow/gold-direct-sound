import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";
import { BottomNavBarAdmin } from "@/components/mobile/BottomNavBarAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SpotlightEntry {
  id: string;
  campaign_id: string;
  artist_id: string;
  track_id: string;
  title: string | null;
  description: string | null;
  total_votes: number;
  status: string;
  created_at: string;
  tracks: {
    title: string;
  };
  artist_profiles: {
    artist_name: string;
  };
}

interface Campaign {
  name: string;
  description: string | null;
  status: string;
}

export default function AdminSpotlightEntries() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [entries, setEntries] = useState<SpotlightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/');
      return;
    }
    if (campaignId) {
      fetchCampaignAndEntries();
    }
  }, [hasRole, navigate, campaignId]);

  const fetchCampaignAndEntries = async () => {
    try {
      const [campaignRes, entriesRes] = await Promise.all([
        supabase.from('spotlight_campaigns').select('name, description, status').eq('id', campaignId).single(),
        supabase
          .from('spotlight_entries')
          .select(`
            *,
            tracks (title),
            artist_profiles (artist_name)
          `)
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaign(campaignRes.data);
      setEntries(entriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (entryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('spotlight_entries')
        .update({ status: newStatus })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Entry ${newStatus}`,
      });

      fetchCampaignAndEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const filteredEntries = filter === "all" 
    ? entries 
    : entries.filter(e => e.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading entries...</p>
      </div>
    );
  }

  return (
    <>
      <MobileAdminNav />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/spotlight')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>

        {campaign && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
        )}

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{entry.title || entry.tracks.title}</CardTitle>
                    <CardDescription>
                      by {entry.artist_profiles.artist_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(entry.status)}
                    <Badge variant="outline">{entry.total_votes} votes</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {entry.description && (
                  <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>
                )}
                {entry.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(entry.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(entry.id, 'rejected')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No entries found</p>
          </div>
        )}
        </div>
      </div>
    </>
  );
}