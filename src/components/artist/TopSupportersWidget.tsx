import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import SupporterBadge from "@/components/supporter/SupporterBadge";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface Supporter {
  fan_user_id: string;
  score: number;
  level: 'bronze' | 'silver' | 'gold';
  profiles: {
    full_name: string | null;
  };
}

interface TopSupportersWidgetProps {
  artistId: string;
}

export function TopSupportersWidget({ artistId }: TopSupportersWidgetProps) {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSupporters();
  }, [artistId]);

  const fetchTopSupporters = async () => {
    try {
      const { data: supportersData, error } = await supabase
        .from('fan_support_scores')
        .select('fan_user_id, score, level')
        .eq('artist_id', artistId)
        .order('score', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (!supportersData || supportersData.length === 0) {
        setSupporters([]);
        setLoading(false);
        return;
      }

      // Fetch profiles from public_profiles view (respects privacy)
      const userIds = supportersData.map(s => s.fan_user_id);
      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const supportersWithProfiles = supportersData.map(supporter => ({
        ...supporter,
        level: supporter.level as 'bronze' | 'silver' | 'gold',
        profiles: profilesMap.get(supporter.fan_user_id) || { full_name: null },
      }));

      setSupporters(supportersWithProfiles);
    } catch (error) {
      console.error('Error fetching top supporters:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Top Supporters
            <InfoTooltip
              title="Your Top Supporters"
              description="Fans earn support points by liking, sharing, voting, and engaging with your content. Higher levels mean stronger fans!"
              forRole="artist"
              learnLink="/learn?tab=artist#supporters-help"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (supporters.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Top Supporters
            <InfoTooltip
              title="Your Top Supporters"
              description="Fans earn support points by liking, sharing, voting, and engaging with your content. Higher levels mean stronger fans!"
              forRole="artist"
              learnLink="/learn?tab=artist#supporters-help"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No supporters yet. Fans earn support points by engaging with your content!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm hover:shadow-gold/10 transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Top Supporters
          <InfoTooltip
            title="Your Top Supporters"
            description="Fans earn support points by liking, sharing, voting, and engaging with your content. Higher levels mean stronger fans!"
            forRole="artist"
            learnLink="/learn?tab=artist#supporters-help"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {supporters.map((supporter, index) => {
          const displayName = supporter.profiles?.full_name || 'Anonymous';
          const initial = displayName[0]?.toUpperCase() || '?';

          return (
            <div key={supporter.fan_user_id} className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg font-bold text-primary w-6">
                  #{index + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SupporterBadge level={supporter.level} variant="mini" />
                    <span className="text-xs text-muted-foreground">
                      {supporter.score.toFixed(0)} points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
