import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { Trophy, TrendingUp, Heart, MessageSquare, Play, Share2, Star, Flame } from "lucide-react";
import SupporterBadge from "@/components/supporter/SupporterBadge";

interface SupportScore {
  artist_id: string;
  score: number;
  level: 'none' | 'bronze' | 'silver' | 'gold';
  updated_at: string;
  artist_profiles: {
    artist_name: string;
    avatar_url: string | null;
    user_id: string;
  };
}

interface SpotlightStats {
  total_votes: number;
  current_tier: string;
}

const LEVEL_THRESHOLDS = {
  bronze: 10,
  silver: 50,
  gold: 150,
};

export default function FanSupporter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supportScores, setSupportScores] = useState<SupportScore[]>([]);
  const [spotlightStats, setSpotlightStats] = useState<SpotlightStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSupporterData();
  }, [user, navigate]);

  const fetchSupporterData = async () => {
    if (!user) return;

    try {
      // Fetch support scores
      const { data: scores } = await supabase
        .from('fan_support_scores')
        .select(`
          artist_id,
          score,
          level,
          updated_at,
          artist_profiles (
            artist_name,
            avatar_url,
            user_id
          )
        `)
        .eq('fan_user_id', user.id)
        .order('score', { ascending: false });

      if (scores) {
        setSupportScores(scores as any);
      }

      // Fetch spotlight stats
      const { data: spotlight } = await supabase
        .from('fan_spotlight_stats')
        .select('total_votes, current_tier')
        .eq('user_id', user.id)
        .single();

      if (spotlight) {
        setSpotlightStats(spotlight);
      }
    } catch (error) {
      console.error('Error fetching supporter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextLevelThreshold = (currentLevel: string, currentScore: number): { threshold: number; level: string } => {
    if (currentScore < LEVEL_THRESHOLDS.bronze) {
      return { threshold: LEVEL_THRESHOLDS.bronze, level: 'Bronze' };
    }
    if (currentScore < LEVEL_THRESHOLDS.silver) {
      return { threshold: LEVEL_THRESHOLDS.silver, level: 'Silver' };
    }
    if (currentScore < LEVEL_THRESHOLDS.gold) {
      return { threshold: LEVEL_THRESHOLDS.gold, level: 'Gold' };
    }
    return { threshold: LEVEL_THRESHOLDS.gold, level: 'Gold' };
  };

  const totalScore = supportScores.reduce((sum, s) => sum + Number(s.score), 0);
  const highestLevel = supportScores.length > 0 
    ? supportScores.reduce((max, s) => {
        const levels = ['none', 'bronze', 'silver', 'gold'];
        return levels.indexOf(s.level) > levels.indexOf(max) ? s.level : max;
      }, 'none' as 'none' | 'bronze' | 'silver' | 'gold')
    : 'none';
  
  const topArtist = supportScores.length > 0 ? supportScores[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your Supporter Pass...</p>
      </div>
    );
  }

  return (
    <>
      <MobileFanNav />
      <div className="min-h-screen py-24 px-4 pb-32 md:pb-28">
        <div className="container mx-auto max-w-5xl space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Your Supporter Pass</span>
            </div>
            <h1 className="text-4xl font-bold">Support Your Artists</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every interaction earns support points. Level up your support and show artists you care.
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Artists Supported</h3>
              </div>
              <p className="text-3xl font-bold">{supportScores.length}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Highest Tier</h3>
              </div>
              <p className="text-3xl font-bold capitalize">{highestLevel}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Total Points</h3>
              </div>
              <p className="text-3xl font-bold">{totalScore.toFixed(0)}</p>
            </Card>
          </div>

          {/* Top Supported Artist */}
          {topArtist && (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Top Supported Artist</h2>
              </div>
              <div className="flex items-center gap-6">
                {topArtist.artist_profiles.avatar_url ? (
                  <img
                    src={topArtist.artist_profiles.avatar_url}
                    alt={topArtist.artist_profiles.artist_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl text-primary font-bold">
                      {topArtist.artist_profiles.artist_name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{topArtist.artist_profiles.artist_name}</h3>
                  <SupporterBadge level={topArtist.level} score={Number(topArtist.score)} variant="compact" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/artist/${topArtist.artist_profiles.user_id}`)}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  View Profile
                </Button>
              </div>
            </Card>
          )}

          {/* All Support Levels */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Your Support Levels</h2>
            {supportScores.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Start Supporting Artists</h3>
                <p className="text-muted-foreground mb-6">
                  Interact with artists to earn support points and level up!
                </p>
                <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
                  Discover Artists
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {supportScores.map((score) => {
                  const nextLevel = getNextLevelThreshold(score.level, Number(score.score));
                  const progress = (Number(score.score) / nextLevel.threshold) * 100;

                  return (
                    <Card key={score.artist_id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                        {score.artist_profiles.avatar_url ? (
                          <img
                            src={score.artist_profiles.avatar_url}
                            alt={score.artist_profiles.artist_name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg text-primary font-bold">
                              {score.artist_profiles.artist_name[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{score.artist_profiles.artist_name}</h3>
                          <SupporterBadge level={score.level} variant="mini" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Support Points</span>
                          <span className="font-semibold">{Number(score.score).toFixed(1)}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Next: {nextLevel.level}</span>
                            <span>{Number(score.score).toFixed(0)} / {nextLevel.threshold}</span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Heart className="h-3 w-3" />
                          <MessageSquare className="h-3 w-3" />
                          <Play className="h-3 w-3" />
                          <Share2 className="h-3 w-3" />
                          <span className="ml-auto">All interactions earn points</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spotlight Streak */}
          {spotlightStats && spotlightStats.total_votes > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Spotlight Voting</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{spotlightStats.total_votes}</p>
                  <p className="text-sm text-muted-foreground">Total Spotlight Votes</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/spotlight/leaderboard')}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  View Leaderboard
                </Button>
              </div>
            </Card>
          )}

          {/* How It Works */}
          <Card className="p-6 bg-muted/30">
            <h2 className="text-xl font-semibold mb-4">How to Earn Support Points</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Like tracks</h3>
                <p className="text-sm text-muted-foreground">+1 point per like</p>
              </div>
              <div className="space-y-2">
                <Play className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Play music</h3>
                <p className="text-sm text-muted-foreground">+0.5 points per play</p>
              </div>
              <div className="space-y-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Comment</h3>
                <p className="text-sm text-muted-foreground">+2 points per comment</p>
              </div>
              <div className="space-y-2">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Vote in Spotlight</h3>
                <p className="text-sm text-muted-foreground">+5 points per vote</p>
              </div>
              <div className="space-y-2">
                <Share2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Share content</h3>
                <p className="text-sm text-muted-foreground">+3 points per share</p>
              </div>
              <div className="space-y-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Add to Stack</h3>
                <p className="text-sm text-muted-foreground">+2 points per save</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <BottomNavBarFan />
    </>
  );
}
