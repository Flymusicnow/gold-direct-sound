import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { MissionsList } from '@/components/missions/MissionsList';
import { BoostTokenIndicator } from '@/components/reach/BoostTokenIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Sparkles, ArrowLeft } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { BottomNavBarFan } from '@/components/mobile/BottomNavBarFan';

export default function FanMissions() {
  const navigate = useNavigate();
  const socialRitualsEnabled = useFeatureFlag('SOCIAL_RITUALS_ENABLED');
  const reachEconomyEnabled = useFeatureFlag('REACH_ECONOMY_ENABLED');

  if (!socialRitualsEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pb-44 md:pb-24">
          <Button
            variant="ghost"
            onClick={() => navigate("/fan")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Missions Coming Soon</h2>
              <p className="text-muted-foreground">
                Daily and weekly missions are on the way. Stay tuned!
              </p>
            </CardContent>
          </Card>
        </main>
        <BottomNavBarFan />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pb-44 md:pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/fan")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Missions
              </h1>
              <p className="text-muted-foreground">
                Complete missions to earn XP and unlock rewards
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
                  <h3 className="font-medium text-sm">How it works</h3>
                  <p className="text-sm text-muted-foreground">
                    Daily missions reset at midnight. Weekly missions reset every Monday. 
                    Complete them to earn XP and support your favorite artists!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Missions List */}
          <MissionsList />
        </div>
      </main>
      <BottomNavBarFan />
    </div>
  );
}
