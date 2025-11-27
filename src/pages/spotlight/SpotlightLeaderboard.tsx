import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Entry {
  id: string;
  title: string | null;
  total_votes: number;
  tracks: {
    title: string;
  };
  artist_profiles: {
    artist_name: string;
  };
}

export default function SpotlightLeaderboard() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const fetchData = async () => {
    try {
      const [campaignRes, entriesRes] = await Promise.all([
        supabase
          .from('spotlight_campaigns')
          .select('name')
          .eq('id', campaignId)
          .single(),
        supabase
          .from('spotlight_entries')
          .select(`
            *,
            tracks (title),
            artist_profiles (artist_name)
          `)
          .eq('campaign_id', campaignId)
          .eq('status', 'approved')
          .order('total_votes', { ascending: false })
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaignName(campaignRes.data.name);
      setEntries(entriesRes.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-[#FFD700]" />;
      case 1:
        return <Medal className="h-6 w-6 text-[#C0C0C0]" />;
      case 2:
        return <Award className="h-6 w-6 text-[#CD7F32]" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/spotlight/${campaignId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Button>

        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-[#E8BF1A] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">{campaignName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    index < 3 ? 'bg-gradient-to-r from-[#E8BF1A]/10 to-transparent' : 'hover:bg-muted/50'
                  } transition-colors`}
                >
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index) || (
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {entry.title || entry.tracks.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.artist_profiles.artist_name}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={index < 3 ? 'border-[#E8BF1A] text-[#E8BF1A]' : ''}
                  >
                    {entry.total_votes} votes
                  </Badge>
                </div>
              ))}
            </div>

            {entries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No entries yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}