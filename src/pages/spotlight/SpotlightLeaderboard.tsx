import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SpotlightVoteButton from "@/components/spotlight/SpotlightVoteButton";

interface Entry {
  id: string;
  title: string | null;
  total_votes: number;
  tracks: {
    title: string;
  };
  artist_profiles: {
    artist_name: string;
    user_id?: string;
  };
}

export default function SpotlightLeaderboard() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(true);
  const [previousVotes, setPreviousVotes] = useState<Record<string, number>>({});
  const [changedEntries, setChangedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (campaignId) {
      fetchData();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
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
            artist_profiles (artist_name, user_id)
          `)
          .eq('campaign_id', campaignId)
          .eq('status', 'approved')
          .order('total_votes', { ascending: false })
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaignName(campaignRes.data.name);
      
      // Track vote changes
      const newEntries = entriesRes.data || [];
      const changed = new Set<string>();
      
      newEntries.forEach(entry => {
        if (previousVotes[entry.id] && previousVotes[entry.id] !== entry.total_votes) {
          changed.add(entry.id);
        }
      });
      
      setChangedEntries(changed);
      setTimeout(() => setChangedEntries(new Set()), 2000);
      
      // Update previous votes
      const votesMap: Record<string, number> = {};
      newEntries.forEach(entry => {
        votesMap[entry.id] = entry.total_votes;
      });
      setPreviousVotes(votesMap);
      
      setEntries(newEntries);
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
      {/* Sticky Back Button */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all spotlight-rank-transition ${
                    index < 3 ? 'bg-gradient-to-r from-[#E8BF1A]/10 to-transparent spotlight-glow-gold' : 'hover:bg-muted/50'
                  } ${changedEntries.has(entry.id) ? 'vote-flash' : ''}`}
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
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={index < 3 ? 'border-[#E8BF1A] text-[#E8BF1A]' : ''}
                    >
                      {entry.total_votes} votes
                    </Badge>
                    <SpotlightVoteButton
                      entryId={entry.id}
                      artistUserId={entry.artist_profiles.user_id}
                      onVoteSuccess={fetchData}
                    />
                  </div>
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