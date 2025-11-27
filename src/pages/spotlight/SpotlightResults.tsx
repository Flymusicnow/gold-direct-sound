import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Medal, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SpotlightShareModal from "@/components/spotlight/SpotlightShareModal";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
}

interface ResultEntry {
  id: string;
  title: string | null;
  total_votes: number;
  tracks: {
    title: string;
    cover_url: string | null;
  };
  artist_profiles: {
    id: string;
    artist_name: string;
  };
}

export default function SpotlightResults() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareEntry, setShareEntry] = useState<any>(null);

  useEffect(() => {
    if (campaignId) {
      fetchResults();
    }
  }, [campaignId]);

  const fetchResults = async () => {
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
            tracks (title, cover_url),
            artist_profiles (id, artist_name)
          `)
          .eq('campaign_id', campaignId)
          .eq('status', 'approved')
          .order('total_votes', { ascending: false })
          .limit(20)
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaign(campaignRes.data);
      setResults(entriesRes.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-[#E8BF1A]" />;
    if (index === 1) return <Medal className="h-6 w-6 text-slate-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-orange-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/spotlight/archive">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Archive
            </Button>
          </Link>

          <div className="text-center">
            <Sparkles className="h-12 w-12 text-[#E8BF1A] mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
            <p className="text-muted-foreground mb-2">{campaign.description}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
            </p>
            <Badge variant="secondary" className="mt-2">Final Results</Badge>
          </div>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#E8BF1A]" />
              Final Leaderboard
            </h2>

            <div className="space-y-3">
              {results.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    index < 3 ? 'bg-gradient-to-r from-[#E8BF1A]/10 to-transparent border border-[#E8BF1A]/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(index) || (
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>

                  {entry.tracks.cover_url && (
                    <img
                      src={entry.tracks.cover_url}
                      alt={entry.title || entry.tracks.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <p className="font-semibold">{entry.title || entry.tracks.title}</p>
                    <p className="text-sm text-muted-foreground">{entry.artist_profiles.artist_name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {entry.total_votes} votes
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShareEntry({
                        id: entry.id,
                        title: entry.title || entry.tracks.title,
                        artistName: entry.artist_profiles.artist_name,
                        campaignName: campaign.name,
                        rank: index + 1,
                        votes: entry.total_votes,
                      })}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {results.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No entries in this campaign</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {shareEntry && (
        <SpotlightShareModal
          isOpen={true}
          onClose={() => setShareEntry(null)}
          entry={shareEntry}
          campaignId={campaignId!}
        />
      )}
    </div>
  );
}
