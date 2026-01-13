import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileFanNav } from '@/components/fan/MobileFanNav';
import { FanSidebar } from '@/components/fan/FanSidebar';
import { PageBreadcrumb } from '@/components/navigation/PageBreadcrumb';
import { FlyWrappedCard } from '@/components/wrapped/FlyWrappedCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { BottomNavBarFan } from '@/components/mobile/BottomNavBarFan';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface MonthlyWrap {
  month: number;
  year: number;
  top_artists: Array<{ name: string; plays: number }>;
  top_tracks: Array<{ title: string; artist: string }>;
  total_xp_earned: number;
  artists_discovered: number;
  spotlight_votes_cast: number;
  total_plays: number;
}

export default function FanWrapped() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [wraps, setWraps] = useState<MonthlyWrap[]>([]);
  const [loading, setLoading] = useState(true);
  const socialRitualsEnabled = useFeatureFlag('SOCIAL_RITUALS_ENABLED');

  useEffect(() => {
    async function fetchWraps() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('fan_monthly_wraps')
          .select('*')
          .eq('user_id', user.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (error) throw error;
        setWraps((data || []) as unknown as MonthlyWrap[]);
      } catch (error) {
        console.error('Error fetching wraps:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWraps();
  }, [user]);

  const handleShare = (wrap: MonthlyWrap) => {
    const text = `My FlyMusic ${wrap.month}/${wrap.year} Wrapped: ${wrap.total_plays} plays, ${wrap.total_xp_earned} XP earned! 🎵`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  if (!socialRitualsEnabled) {
    return (
      <>
        <MobileFanNav />
        <div className="flex min-h-screen w-full pt-16">
          <FanSidebar />
          <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
            <PageBreadcrumb role="fan" />
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('fan.wrappedComingSoon')}</h2>
                <p className="text-muted-foreground">
                  {t('fan.wrappedComingSoonDescription')}
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
        {isMobile && <BottomNavBarFan />}
      </>
    );
  }

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                {t('fan.wrapped')}
              </h1>
              <p className="text-muted-foreground">
                {t('fan.wrappedDescription')}
              </p>
            </div>

            {/* Wraps List */}
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : wraps.length > 0 ? (
              <div className="space-y-4">
                {wraps.map((wrap, i) => (
                  <FlyWrappedCard
                    key={i}
                    month={wrap.month}
                    year={wrap.year}
                    topArtists={wrap.top_artists || []}
                    topTracks={wrap.top_tracks || []}
                    totalXpEarned={wrap.total_xp_earned}
                    artistsDiscovered={wrap.artists_discovered}
                    spotlightVotes={wrap.spotlight_votes_cast}
                    totalPlays={wrap.total_plays}
                    onShare={() => handleShare(wrap)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{t('fan.noWrapsYet')}</h2>
                  <p className="text-muted-foreground">
                    {t('fan.noWrapsYetDescription')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
