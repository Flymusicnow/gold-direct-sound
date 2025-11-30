import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import SpotlightEntryCard from "@/components/spotlight/SpotlightEntryCard";
import SpotlightSupporterBadge from "@/components/spotlight/SpotlightSupporterBadge";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
}

interface Entry {
  id: string;
  track_id: string;
  title: string | null;
  description: string | null;
  total_votes: number;
  tracks: {
    title: string;
    cover_url: string | null;
    audio_url: string;
  };
  artist_profiles: {
    id: string;
    artist_name: string;
  };
}

export default function SpotlightCampaign() {
  const { user } = useAuth();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topEntries, setTopEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"votes" | "newest">("votes");
  const [previousVotes, setPreviousVotes] = useState<Record<string, number>>({});
  const [changedEntries, setChangedEntries] = useState<Set<string>>(new Set());
  const [supporterStats, setSupporterStats] = useState<{ tier: string; totalVotes: number } | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchData();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [campaignId, sortBy]);

  const fetchData = async () => {
    try {
      const [campaignRes, entriesRes] = await Promise.all([
        supabase
          .from('spotlight_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single(),
        supabase
          .from('spotlight_entries')
          .select(`
            *,
            tracks (title, cover_url, audio_url),
            artist_profiles (id, artist_name)
          `)
          .eq('campaign_id', campaignId)
          .eq('status', 'approved')
          .order(sortBy === 'votes' ? 'total_votes' : 'created_at', { ascending: false })
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaign(campaignRes.data);
      
      // Track vote changes
      const newEntries = entriesRes.data || [];
      const changed = new Set<string>();
      
      newEntries.forEach(entry => {
        if (previousVotes[entry.id] && previousVotes[entry.id] !== entry.total_votes) {
          changed.add(entry.id);
        }
      });
      
      setChangedEntries(changed);
      setTimeout(() => setChangedEntries(new Set()), 2000); // Clear flash after 2s
      
      // Update previous votes
      const votesMap: Record<string, number> = {};
      newEntries.forEach(entry => {
        votesMap[entry.id] = entry.total_votes;
      });
      setPreviousVotes(votesMap);
      
      setEntries(newEntries);
      setTopEntries(newEntries.slice(0, 10));

      // Fetch supporter stats if user is logged in
      if (user) {
        const { data: statsData } = await supabase
          .from('fan_spotlight_stats')
          .select('total_votes, current_tier')
          .eq('user_id', user.id)
          .single();

        if (statsData) {
          setSupporterStats({
            tier: statsData.current_tier,
            totalVotes: statsData.total_votes,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#E8BF1A]/10 to-background py-16 px-4">
        <div className="container mx-auto text-center">
          <Sparkles className="h-16 w-16 text-[#E8BF1A] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-4">{campaign.name}</h1>
          <p className="text-lg text-muted-foreground mb-4">{campaign.description}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
            <span>-</span>
            <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
          </div>
          <Badge className="mt-4" variant={campaign.status === 'active' ? 'default' : 'secondary'}>
            {campaign.status}
          </Badge>

          {/* Supporter Badge for logged-in users */}
          {user && supporterStats && supporterStats.tier !== 'none' && (
            <div className="mt-6 max-w-xs mx-auto">
              <SpotlightSupporterBadge
                tier={supporterStats.tier}
                totalVotes={supporterStats.totalVotes}
                variant="compact"
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Leaderboard Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-[#E8BF1A]" />
              <h2 className="text-2xl font-bold">Top 10 Leaderboard</h2>
            </div>
            <Link
              to={`/spotlight/${campaignId}/leaderboard`}
              className="text-[#E8BF1A] hover:underline text-sm"
            >
              View Full Leaderboard →
            </Link>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {topEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-all spotlight-rank-transition ${
                      index < 3 ? 'spotlight-glow-gold' : 'hover:bg-muted/50'
                    } ${changedEntries.has(entry.id) ? 'vote-flash' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E8BF1A]/10 text-[#E8BF1A] font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.title || entry.tracks.title}</p>
                      <p className="text-sm text-muted-foreground">{entry.artist_profiles.artist_name}</p>
                    </div>
                    <Badge variant="outline">{entry.total_votes} votes</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entries Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">All Entries</h2>
              <InfoTooltip
                title="How Spotlight Voting Works"
                description="Vote for your favorite tracks in this campaign! Each fan gets one vote per entry. Your vote helps artists gain visibility and rise on the leaderboard."
                learnLink="/learn?tab=fan#spotlight"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Voted</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <SpotlightEntryCard
                key={entry.id}
                entry={entry}
                onVoteSuccess={fetchData}
                campaignId={campaignId}
              />
            ))}
          </div>

          {entries.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No entries yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}