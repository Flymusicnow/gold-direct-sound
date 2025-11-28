import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/artist/EmptyStateCard";
import { Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SpotlightSubmitDialog from "@/components/spotlight/SpotlightSubmitDialog";

interface SpotlightCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
}

interface SpotlightEntry {
  id: string;
  campaign_id: string;
  status: string;
  total_votes: number;
  title: string | null;
  cached_rank: number | null;
  tracks: {
    title: string;
  };
  spotlight_campaigns: {
    name: string;
  };
}

export default function StudioSpotlight() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<SpotlightCampaign[]>([]);
  const [myEntries, setMyEntries] = useState<SpotlightEntry[]>([]);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get artist profile
      const { data: profile, error: profileError } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setArtistProfile(profile);

      // Get active/upcoming campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('spotlight_campaigns')
        .select('*')
        .in('status', ['upcoming', 'active'])
        .order('start_date', { ascending: true });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Get my entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('spotlight_entries')
        .select(`
          *,
          tracks (title),
          spotlight_campaigns (name)
        `)
        .eq('artist_id', profile.id)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;
      setMyEntries(entriesData || []);
    } catch (error) {
      console.error('Error fetching spotlight data:', error);
      toast({
        title: "Error",
        description: "Failed to load spotlight data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasSubmittedToCampaign = (campaignId: string) => {
    return myEntries.some(entry => entry.campaign_id === campaignId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="h-8 w-8 text-[#E8BF1A]" />
          <h1 className="text-3xl font-bold text-foreground">FlyMusic Spotlight</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Active Campaigns</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => {
              const hasSubmitted = hasSubmittedToCampaign(campaign.id);
              const myEntry = myEntries.find(e => e.campaign_id === campaign.id);

              return (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
                    {hasSubmitted && myEntry ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Your submission:</span>
                          {getStatusBadge(myEntry.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {myEntry.title || myEntry.tracks.title}
                        </p>
                        {myEntry.status === 'approved' && (
                          <Badge variant="outline">{myEntry.total_votes} votes</Badge>
                        )}
                      </div>
                    ) : (
                      <SpotlightSubmitDialog
                        campaignId={campaign.id}
                        artistId={artistProfile?.id}
                        onSuccess={fetchData}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {campaigns.length === 0 && (
            <EmptyStateCard
              icon={Sparkles}
              title="No active campaigns"
              description="Spotlight campaigns will appear here when they're live. Check back soon!"
              ctaText="Learn More"
              ctaPath="/spotlight/archive"
              variant="gold"
            />
          )}
        </div>

        {/* Past Campaigns */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Past Campaigns</h2>
          <div className="grid gap-4">
            {myEntries
              .filter((entry) => {
                const campaign = campaigns.find((c) => c.id === entry.campaign_id);
                return !campaign; // Entry's campaign is not in active/upcoming list
              })
              .map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{entry.title || entry.tracks.title}</CardTitle>
                        <CardDescription>{entry.spotlight_campaigns.name}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.total_votes} votes</Badge>
                        {entry.cached_rank && (
                          <Badge variant="secondary">Final Rank: #{entry.cached_rank}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>

          {myEntries.filter((entry) => !campaigns.find((c) => c.id === entry.campaign_id)).length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No past campaign entries</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Current Spotlight Entries</h2>
          <div className="grid gap-4">
            {myEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{entry.title || entry.tracks.title}</CardTitle>
                      <CardDescription>{entry.spotlight_campaigns.name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(entry.status)}
                      {entry.status === 'approved' && (
                        <Badge variant="outline">{entry.total_votes} votes</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {myEntries.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No submissions yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}