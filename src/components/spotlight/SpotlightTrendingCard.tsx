import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, TrendingUp } from "lucide-react";

interface TrendingEntry {
  id: string;
  title: string | null;
  total_votes: number;
  campaign_id: string;
  tracks: {
    title: string;
    cover_url: string | null;
    audio_url: string;
  };
  artist_profiles: {
    artist_name: string;
  };
}

interface SpotlightTrendingCardProps {
  onPlayTrack?: (audioUrl: string, title: string, artistName: string, coverUrl?: string) => void;
}

export function SpotlightTrendingCard({ onPlayTrack }: SpotlightTrendingCardProps) {
  const navigate = useNavigate();
  const [trendingEntries, setTrendingEntries] = useState<TrendingEntry[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingEntries();
  }, []);

  const fetchTrendingEntries = async () => {
    try {
      // Get active campaign
      const { data: campaign } = await supabase
        .from('spotlight_campaigns')
        .select('id')
        .eq('status', 'active')
        .single();

      if (!campaign) {
        setLoading(false);
        return;
      }

      setCampaignId(campaign.id);

      // Get top 5 entries
      const { data: entries, error } = await supabase
        .from('spotlight_entries')
        .select(`
          *,
          tracks (title, cover_url, audio_url),
          artist_profiles (artist_name)
        `)
        .eq('campaign_id', campaign.id)
        .eq('status', 'approved')
        .order('total_votes', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrendingEntries(entries || []);
    } catch (error) {
      console.error('Error fetching trending entries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || trendingEntries.length === 0) {
    return null;
  }

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending in Spotlight
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/spotlight/${campaignId}`)}
            className="text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>

              <div className="relative w-12 h-12 flex-shrink-0">
                {entry.tracks.cover_url ? (
                  <img
                    src={entry.tracks.cover_url}
                    alt={entry.title || entry.tracks.title}
                    className="w-full h-full rounded object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {entry.title || entry.tracks.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.artist_profiles.artist_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/50 text-primary">
                  {entry.total_votes}
                </Badge>
                
                {onPlayTrack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onPlayTrack(
                      entry.tracks.audio_url,
                      entry.title || entry.tracks.title,
                      entry.artist_profiles.artist_name,
                      entry.tracks.cover_url || undefined
                    )}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}