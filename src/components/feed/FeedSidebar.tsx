import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingSection } from "@/components/TrendingSection";
import { UpcomingEventsCard } from "@/components/feed/UpcomingEventsCard";
import { FlightdeckItem } from "@/contexts/FlightdeckContext";

interface FeedSidebarProps {
  followedArtistIds: string[];
  onTrackPlay: (item: FlightdeckItem) => void;
  followingCount: number;
}

export function FeedSidebar({ 
  followedArtistIds, 
  onTrackPlay,
  followingCount 
}: FeedSidebarProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('fan.yourStats')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">{followingCount}</p>
            <p className="text-xs text-muted-foreground">{t('fan.artistsFollowing')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">--</p>
            <p className="text-xs text-muted-foreground">{t('fan.votesThisWeek')}</p>
          </div>
        </div>
      </Card>

      {/* Upcoming Events */}
      <UpcomingEventsCard followedArtistIds={followedArtistIds} />

      {/* Trending - Compact */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('fan.trending')}</h3>
        </div>
        <TrendingSection
          type="tracks"
          limit={5}
          onTrackPlay={onTrackPlay}
        />
      </Card>
    </div>
  );
}
