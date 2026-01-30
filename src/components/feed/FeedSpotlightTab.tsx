import { Star, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SpotlightTrendingCard } from "@/components/spotlight/SpotlightTrendingCard";
import { SpotlightNewEntryCard } from "@/components/spotlight/SpotlightNewEntryCard";
import { SpotlightRisingCard } from "@/components/spotlight/SpotlightRisingCard";
import SpotlightRankMilestoneCard from "@/components/spotlight/SpotlightRankMilestoneCard";
import { FlightdeckItem } from "@/contexts/FlightdeckContext";

interface FeedSpotlightTabProps {
  onPlayTrack: (item: FlightdeckItem) => void;
}

export function FeedSpotlightTab({ onPlayTrack }: FeedSpotlightTabProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handlePlaySpotlightTrack = (url: string, title: string, artist: string, cover?: string) => {
    onPlayTrack({
      id: `spotlight-${url}`,
      type: 'track',
      title,
      artistId: '',
      artistName: artist,
      artistUserId: '',
      mediaUrl: url,
      coverUrl: cover,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick action to vote */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm">{t('fan.spotlightDescription')}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/spotlight')}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <Star className="h-4 w-4 mr-2" />
          {t('fan.voteNow')}
        </Button>
      </div>

      {/* Your Artists in Top 10 */}
      <SpotlightRankMilestoneCard />

      {/* Trending in Spotlight */}
      <SpotlightTrendingCard onPlayTrack={handlePlaySpotlightTrack} />

      {/* New Entries */}
      <SpotlightNewEntryCard onPlayTrack={handlePlaySpotlightTrack} />

      {/* Rising Artists */}
      <SpotlightRisingCard />
    </div>
  );
}
