import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, Calendar, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CampaignArchive {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  entry_count: number;
  winner?: {
    artistName: string;
    trackTitle: string;
    votes: number;
  };
}

export default function SpotlightArchive() {
  const [campaigns, setCampaigns] = useState<CampaignArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchive();
  }, []);

  const fetchArchive = async () => {
    try {
      // Get ended campaigns
      const { data: campaignsData, error } = await supabase
        .from('spotlight_campaigns')
        .select('*')
        .eq('status', 'ended')
        .order('end_date', { ascending: false });

      if (error) throw error;

      // For each campaign, get entry count and winner
      const campaignsWithDetails = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          // Get entry count
          const { count } = await supabase
            .from('spotlight_entries')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status', 'approved');

          // Get winner (top entry)
          const { data: topEntry } = await supabase
            .from('spotlight_entries')
            .select(`
              title,
              total_votes,
              tracks (title),
              artist_profiles (artist_name)
            `)
            .eq('campaign_id', campaign.id)
            .eq('status', 'approved')
            .order('total_votes', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...campaign,
            entry_count: count || 0,
            winner: topEntry ? {
              artistName: topEntry.artist_profiles.artist_name,
              trackTitle: topEntry.title || topEntry.tracks.title,
              votes: topEntry.total_votes,
            } : undefined,
          };
        })
      );

      setCampaigns(campaignsWithDetails);
    } catch (error) {
      console.error('Error fetching archive:', error);
      toast({
        title: "Error",
        description: "Failed to load archive",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading archive...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Sparkles className="h-16 w-16 text-[#E8BF1A] mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Spotlight Archive</h1>
          <p className="text-muted-foreground">Browse past FlyMusic Spotlight campaigns</p>
        </div>

        {/* Campaigns Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} to={`/spotlight/${campaign.id}/results`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <Badge variant="secondary">Ended</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{campaign.entry_count} entries</span>
                  </div>

                  {campaign.winner && (
                    <div className="p-3 rounded-lg bg-[#E8BF1A]/10 border border-[#E8BF1A]/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-[#E8BF1A]" />
                        <span className="text-sm font-semibold text-[#E8BF1A]">Winner</span>
                      </div>
                      <p className="text-sm font-medium">{campaign.winner.trackTitle}</p>
                      <p className="text-xs text-muted-foreground">{campaign.winner.artistName} · {campaign.winner.votes} votes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No archived campaigns yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
