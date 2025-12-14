import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { FlyWrappedCard } from '@/components/wrapped/FlyWrappedCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { BottomNavBarFan } from '@/components/mobile/BottomNavBarFan';
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
  const navigate = useNavigate();
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
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">FlyWrapped Coming Soon</h2>
              <p className="text-muted-foreground">
                Your monthly music journey summaries are on the way!
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
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              FlyWrapped
            </h1>
            <p className="text-muted-foreground">
              Your monthly music journey on FlyMusic
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
                <h2 className="text-xl font-semibold mb-2">No Wraps Yet</h2>
                <p className="text-muted-foreground">
                  Your first FlyWrapped will be generated at the end of the month!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <BottomNavBarFan />
    </div>
  );
}
