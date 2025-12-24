import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trophy, TrendingUp, Heart, MessageSquare, Play, Share2, Star, Flame, ArrowRight } from "lucide-react";
import SupporterBadge from "@/components/supporter/SupporterBadge";
import { ManageSubscriptionCard } from "@/components/supporter/ManageSubscriptionCard";
import { useFanAchievements } from "@/hooks/useFanAchievements";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [supportScores, setSupportScores] = useState<SupportScore[]>([]);
  const [spotlightStats, setSpotlightStats] = useState<SpotlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { achievements, totalXP, supporterLevel, nextLevelXP, progressToNextLevel } = useFanAchievements();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSupporterData();
    
    // Track onboarding progress
    supabase
      .from('fan_onboarding_progress')
      .upsert({
        user_id: user.id,
        has_viewed_supporter: true,
      })
      .then(() => {
        // Progress tracked
      }, (err) => {
        console.error('Error tracking supporter visit:', err);
      });
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
        <p className="text-muted-foreground">{t('fan.loadingSupporterPass')}</p>
      </div>
    );
  }

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8">
          <PageBreadcrumb role="fan" />
          
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
            {/* Hero Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">{t('fan.yourSupporterPass')}</span>
              </div>
              <h1 className="text-4xl font-bold">{t('fan.growYourSupporterLevel')}</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('fan.trackYourJourney')}
              </p>
            </div>

            {/* Fan XP Progress */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{t('fan.yourActivityXP')}</h2>
                    <InfoTooltip
                      title={t('fan.activityXP')}
                      description={t('fan.activityXPDescription')}
                      forRole="fan"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalXP.toFixed(0)} {t('fan.totalPointsEarned')}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Progress value={Math.min((totalXP / 200) * 100, 100)} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('fan.keepEngagingToLevelUp')}</span>
                  <span className="font-semibold text-primary">{totalXP.toFixed(0)} XP</span>
                </div>
              </div>
            </Card>

            {/* Achievements Section */}
            <Card className="bg-card/30 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {t('fan.yourFanJourney')}
                </CardTitle>
                <CardDescription>{t('fan.unlockAchievements')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('fan.progressToNextLevel')}</span>
                    <span className="text-primary font-semibold">{Math.round(progressToNextLevel)}%</span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {totalXP} {t('fan.totalXP')} · {achievements.filter(a => a.unlocked).length}/{achievements.length} {t('fan.achievements')}
                  </p>
                </div>

                <div className="pt-2">
                  <Link to="/fan/achievements">
                    <Button variant="outline" className="w-full gap-2">
                      {t('fan.viewAllAchievements')} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Overall Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.artistsSupported')}</h3>
                </div>
                <p className="text-3xl font-bold">{supportScores.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.highestTier')}</h3>
                </div>
                <p className="text-3xl font-bold capitalize">{highestLevel}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.totalPoints')}</h3>
                </div>
                <p className="text-3xl font-bold">{totalScore.toFixed(0)}</p>
              </Card>
            </div>

            {/* Active Subscriptions */}
            <ManageSubscriptionCard />

            {/* Top Supported Artist */}
            {topArtist && (
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('fan.topSupportedArtist')}</h2>
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
                    {t('fan.viewProfile')}
                  </Button>
                </div>
              </Card>
            )}

            {/* All Support Levels */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">{t('fan.yourSupportLevels')}</h2>
              {supportScores.length === 0 ? (
                <Card className="p-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">{t('fan.startSupportingArtists')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('fan.interactWithArtists')}
                  </p>
                  <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
                    {t('fan.discoverArtists')}
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">{t('fan.supportPoints')}</span>
                              <InfoTooltip
                                title={t('fan.artistSupportPoints')}
                                description={t('fan.artistSupportPointsDescription')}
                                forRole="fan"
                              />
                            </div>
                            <span className="font-semibold">{Number(score.score).toFixed(1)}</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{t('fan.next')}: {nextLevel.level}</span>
                              <span>{Number(score.score).toFixed(0)} / {nextLevel.threshold}</span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <Heart className="h-3 w-3" />
                            <MessageSquare className="h-3 w-3" />
                            <Play className="h-3 w-3" />
                            <Share2 className="h-3 w-3" />
                            <span className="ml-auto">{t('fan.allInteractionsEarnPoints')}</span>
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
                  <h2 className="text-xl font-semibold">{t('fan.spotlightVoting')}</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{spotlightStats.total_votes}</p>
                    <p className="text-sm text-muted-foreground">{t('fan.totalSpotlightVotes')}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/spotlight/leaderboard')}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    {t('fan.viewLeaderboard')}
                  </Button>
                </div>
              </Card>
            )}

            {/* How It Works */}
            <Card className="p-6 bg-muted/30">
              <h2 className="text-xl font-semibold mb-4">{t('fan.howToEarnSupportPoints')}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.likeTracks')}</h3>
                  <p className="text-sm text-muted-foreground">{t('fan.likePointsValue')}</p>
                </div>
                <div className="space-y-2">
                  <Play className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.playMusic')}</h3>
                  <p className="text-sm text-muted-foreground">{t('fan.playPointsValue')}</p>
                </div>
                <div className="space-y-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.comment')}</h3>
                  <p className="text-sm text-muted-foreground">{t('fan.commentPointsValue')}</p>
                </div>
                <div className="space-y-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.voteInSpotlight')}</h3>
                  <p className="text-sm text-muted-foreground">{t('fan.votePointsValue')}</p>
                </div>
                <div className="space-y-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('fan.share')}</h3>
                  <p className="text-sm text-muted-foreground">{t('fan.sharePointsValue')}</p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
