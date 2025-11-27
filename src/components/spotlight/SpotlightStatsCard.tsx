import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Share2, Trophy, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SpotlightStats {
  entryId: string;
  campaignId: string;
  campaignName: string;
  votes: number;
  rank: number;
  totalEntries: number;
}

interface SpotlightStatsCardProps {
  artistId: string;
}

export function SpotlightStatsCard({ artistId }: SpotlightStatsCardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SpotlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteChange, setVoteChange] = useState(false);

  useEffect(() => {
    fetchStats();
    
    // Real-time subscription for instant vote updates
    const channel = supabase
      .channel('spotlight-stats-live')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'spotlight_votes' },
        () => {
          fetchStats();
          setVoteChange(true);
          setTimeout(() => setVoteChange(false), 2000);
        }
      )
      .subscribe();
    
    // Fallback polling every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [artistId]);

  const fetchStats = async () => {
    try {
      // Get artist's approved entry in active campaign
      const { data: entry, error: entryError } = await supabase
        .from('spotlight_entries')
        .select(`
          id,
          campaign_id,
          total_votes,
          spotlight_campaigns!inner (
            name,
            status
          )
        `)
        .eq('artist_id', artistId)
        .eq('status', 'approved')
        .eq('spotlight_campaigns.status', 'active')
        .maybeSingle();

      if (entryError || !entry) {
        setLoading(false);
        return;
      }

      // Get all entries to calculate rank
      const { data: allEntries } = await supabase
        .from('spotlight_entries')
        .select('id, total_votes')
        .eq('campaign_id', entry.campaign_id)
        .eq('status', 'approved')
        .order('total_votes', { ascending: false });

      const rank = (allEntries?.findIndex(e => e.id === entry.id) ?? -1) + 1;
      const totalEntries = allEntries?.length || 0;

      setStats({
        entryId: entry.id,
        campaignId: entry.campaign_id,
        campaignName: entry.spotlight_campaigns.name,
        votes: entry.total_votes || 0,
        rank,
        totalEntries,
      });
    } catch (error) {
      console.error('Error fetching Spotlight stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/spotlight/${stats?.campaignId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Spotlight link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (loading || !stats) {
    return null;
  }

  const isTop3 = stats.rank <= 3;
  const rankColor = stats.rank === 1 ? "text-[#FFD700]" : stats.rank === 2 ? "text-[#C0C0C0]" : stats.rank === 3 ? "text-[#CD7F32]" : "text-primary";

  return (
    <Card className="card-premium bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Spotlight Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Campaign</p>
              <p className="font-semibold">{stats.campaignName}</p>
            </div>
            <Badge variant={isTop3 ? "default" : "outline"} className={isTop3 ? "bg-gradient-gold" : ""}>
              {isTop3 ? "Top 3" : "Active"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className={`h-4 w-4 ${rankColor}`} />
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
              <p className={`text-2xl font-bold ${rankColor}`}>
                #{stats.rank}
              </p>
              <p className="text-xs text-muted-foreground">of {stats.totalEntries}</p>
            </div>

            <div className={`p-4 rounded-lg bg-card border border-border transition-all duration-300 ${voteChange ? 'ring-2 ring-primary shadow-lg shadow-primary/50' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Votes</p>
              </div>
              <p className={`text-2xl font-bold text-primary transition-transform duration-300 ${voteChange ? 'scale-110' : ''}`}>
                {stats.votes}
              </p>
              <p className="text-xs text-muted-foreground">total votes</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-gradient-gold"
              onClick={() => navigate(`/spotlight/${stats.campaignId}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Campaign
            </Button>
          </div>

          {isTop3 && (
            <div className="p-3 rounded-lg bg-gradient-gold/10 border border-primary/30">
              <p className="text-xs text-center text-primary font-medium">
                🎉 You're in the Top 3! Keep sharing to win!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}