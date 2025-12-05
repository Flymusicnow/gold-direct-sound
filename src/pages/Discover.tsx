import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscoverForYouRail } from '@/components/discover/DiscoverForYouRail';
import { DiscoverTrendingRail } from '@/components/discover/DiscoverTrendingRail';
import { DiscoverRisingArtistsRail } from '@/components/discover/DiscoverRisingArtistsRail';
import { DiscoverGenreSection } from '@/components/discover/DiscoverGenreSection';
import { BottomNavBarFan } from '@/components/mobile/BottomNavBarFan';
import { TasteDebugPanel } from '@/components/discover/TasteDebugPanel';
import TransparencyWidget from '@/components/trust/TransparencyWidget';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function Discover() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('for-you');
  const trustLayerEnabled = useFeatureFlag('TRUST_LAYER_ENABLED');

  // Track onboarding progress on first visit
  useEffect(() => {
    if (user) {
      supabase
        .from('fan_onboarding_progress')
        .upsert({
          user_id: user.id,
          has_visited_discover: true,
        })
        .then(() => {
          // Progress tracked
        }, (err) => {
          console.error('Error tracking discover visit:', err);
        });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Discover</h1>
              <InfoTooltip
                title="How Discover Works"
                description="Explore music tailored to your taste. 'For You' is personalized, 'Trending' shows what's hot now, and 'Rising' highlights new talent."
                learnLink="/learn?tab=fan#discover"
              />
            </div>
            {trustLayerEnabled && (
              <TransparencyWidget 
                reasons={{ genreMatch: true, trending: true }}
                genre="your taste"
              />
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 bg-muted/50">
              <TabsTrigger value="for-you">For You</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="rising">Rising</TabsTrigger>
              <TabsTrigger value="genres">Genres</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto">
        {activeTab === 'for-you' && (
          <div className="md:hidden">
            <DiscoverForYouRail />
          </div>
        )}

        {activeTab === 'for-you' && (
          <div className="hidden md:block px-4 py-8 space-y-8">
            <DiscoverTrendingRail />
            <DiscoverRisingArtistsRail />
            <DiscoverGenreSection />
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="px-4 py-8">
            <DiscoverTrendingRail />
          </div>
        )}

        {activeTab === 'rising' && (
          <div className="px-4 py-8">
            <DiscoverRisingArtistsRail />
          </div>
        )}

        {activeTab === 'genres' && (
          <div className="px-4 py-8">
            <DiscoverGenreSection />
          </div>
        )}
      </div>

      {/* Bottom supporter note */}
      <div className="py-8 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
          Your Discover activity helps you grow your Supporter Level.
        </p>
      </div>

      {/* Taste Engine Debug Panel (dev only) */}
      <TasteDebugPanel />

      {/* Mobile bottom nav */}
      <BottomNavBarFan />
    </div>
  );
}
