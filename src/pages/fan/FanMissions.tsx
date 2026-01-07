import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileFanNav } from '@/components/fan/MobileFanNav';
import { FanSidebar } from '@/components/fan/FanSidebar';
import { PageBreadcrumb } from '@/components/navigation/PageBreadcrumb';
import { MissionsList } from '@/components/missions/MissionsList';
import { BoostTokenIndicator } from '@/components/reach/BoostTokenIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Sparkles } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { BottomNavBarFan } from '@/components/mobile/BottomNavBarFan';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FanMissions() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const socialRitualsEnabled = useFeatureFlag('SOCIAL_RITUALS_ENABLED');
  const reachEconomyEnabled = useFeatureFlag('REACH_ECONOMY_ENABLED');

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
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('fan.missionsComingSoon')}</h2>
                <p className="text-muted-foreground">
                  {t('fan.missionsComingSoonDescription')}
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  {t('fan.missions')}
                </h1>
                <p className="text-muted-foreground">
                  {t('fan.missionsDescription')}
                </p>
              </div>
              {reachEconomyEnabled && <BoostTokenIndicator />}
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">{t('fan.howItWorks')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('fan.missionsHowItWorksDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missions List */}
            <MissionsList />
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
