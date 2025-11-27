import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles } from "lucide-react";

interface RankMilestone {
  entryId: string;
  campaignId: string;
  artistName: string;
  trackTitle: string;
  currentRank: number;
}

export default function SpotlightRankMilestoneCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<RankMilestone[]>([]);

  useEffect(() => {
    if (user) {
      fetchMilestones();
      
      // Real-time updates
      const channel = supabase
        .channel('rank-milestones')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'spotlight_entries',
        }, () => {
          fetchMilestones();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMilestones = async () => {
    if (!user) return;

    try {
      // Get followed artists
      const { data: follows } = await supabase
        .from('follows')
        .select('artist_id')
        .eq('fan_id', user.id);

      const artistIds = follows?.map(f => f.artist_id) || [];
      if (artistIds.length === 0) return;

      // Get entries from followed artists in active campaigns
      const { data: entries } = await supabase
        .from('spotlight_entries')
        .select(`
          id,
          campaign_id,
          total_votes,
          cached_rank,
          title,
          artist_id,
          tracks (title),
          artist_profiles (artist_name),
          spotlight_campaigns!inner (status)
        `)
        .in('artist_id', artistIds)
        .eq('status', 'approved')
        .eq('spotlight_campaigns.status', 'active')
        .lte('cached_rank', 10)
        .order('total_votes', { ascending: false });

      if (!entries || entries.length === 0) return;

      const milestoneData: RankMilestone[] = entries.slice(0, 3).map((entry: any, index: number) => ({
        entryId: entry.id,
        campaignId: entry.campaign_id,
        artistName: entry.artist_profiles.artist_name,
        trackTitle: entry.title || entry.tracks.title,
        currentRank: index + 1,
      }));

      setMilestones(milestoneData);
    } catch (error) {
      console.error('Error fetching rank milestones:', error);
    }
  };

  if (milestones.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-[#E8BF1A]" />
        <h3 className="text-lg font-semibold">🔥 Your Artists in Top 10!</h3>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone) => (
          <div
            key={milestone.entryId}
            className="p-4 rounded-lg bg-gradient-to-r from-[#E8BF1A]/10 to-transparent border border-[#E8BF1A]/20"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold">{milestone.artistName}</p>
                <p className="text-sm text-muted-foreground">{milestone.trackTitle}</p>
              </div>
              <div className="flex items-center gap-1 text-[#E8BF1A] font-bold">
                <Sparkles className="h-4 w-4" />
                <span>#{milestone.currentRank}</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/spotlight/${milestone.campaignId}`)}
              className="w-full bg-[#E8BF1A] text-black hover:bg-[#E8BF1A]/80"
            >
              View & Vote
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
