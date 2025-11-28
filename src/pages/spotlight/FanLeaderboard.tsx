import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, Award, Medal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface FanLeaderboardEntry {
  user_id: string;
  full_name: string | null;
  email: string;
  total_votes: number;
  current_tier: string;
  last_voted_at: string | null;
}

export default function FanLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<FanLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_spotlight_stats')
        .select(`
          user_id,
          total_votes,
          current_tier,
          last_voted_at,
          profiles!inner (
            full_name,
            email
          )
        `)
        .order('total_votes', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = (data || []).map((entry: any) => ({
        user_id: entry.user_id,
        full_name: entry.profiles.full_name,
        email: entry.profiles.email,
        total_votes: entry.total_votes,
        current_tier: entry.current_tier,
        last_voted_at: entry.last_voted_at,
      }));

      setLeaderboard(formattedData);
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

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return (
          <Badge className="bg-[#E8BF1A] text-black hover:bg-[#E8BF1A]/90">
            <Trophy className="h-3 w-3 mr-1" />
            Gold Supporter
          </Badge>
        );
      case 'silver':
        return (
          <Badge className="bg-slate-400 text-black hover:bg-slate-400/90">
            <Award className="h-3 w-3 mr-1" />
            Silver Supporter
          </Badge>
        );
      case 'bronze':
        return (
          <Badge className="bg-amber-700 text-white hover:bg-amber-700/90">
            <Medal className="h-3 w-3 mr-1" />
            Bronze Supporter
          </Badge>
        );
      default:
        return <Badge variant="outline">Supporter</Badge>;
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-[#E8BF1A]" />;
    if (index === 1) return <Award className="h-6 w-6 text-slate-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Sparkles className="h-16 w-16 text-[#E8BF1A] mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Fan Leaderboard</h1>
          <p className="text-muted-foreground">
            Top supporters who are driving the FlyMusic Spotlight
          </p>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#E8BF1A]" />
              Top 50 Voters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={`p-4 rounded-lg border transition-all ${
                    index < 3
                      ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Icon */}
                    <div className="flex-shrink-0 w-12 flex justify-center">
                      {getRankIcon(index)}
                    </div>

                    {/* Fan Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">
                          {entry.full_name || entry.email.split('@')[0]}
                        </p>
                        {getTierBadge(entry.current_tier)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-[#E8BF1A]">
                          {entry.total_votes} votes
                        </span>
                        {entry.last_voted_at && (
                          <span>
                            Last voted{' '}
                            {formatDistanceToNow(new Date(entry.last_voted_at), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No voters yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tier Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Earn Tiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <Medal className="h-5 w-5 text-amber-700" />
              <span>
                <span className="font-semibold">Bronze Supporter:</span> 10+ votes
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-slate-400" />
              <span>
                <span className="font-semibold">Silver Supporter:</span> 25+ votes
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-[#E8BF1A]" />
              <span>
                <span className="font-semibold">Gold Supporter:</span> 50+ votes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
