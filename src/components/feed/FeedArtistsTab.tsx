import { Users, Sparkles, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DiscoverArtists } from "@/components/DiscoverArtists";
import { StaggeredList } from "@/components/ui/StaggeredList";

interface FeedArtistsTabProps {
  followedGenres: string[];
  followedArtistIds: string[];
  liveArtistIds: Set<string>;
}

export function FeedArtistsTab({ 
  followedGenres, 
  followedArtistIds,
  liveArtistIds 
}: FeedArtistsTabProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Live Now Banner */}
      {liveArtistIds.size > 0 && (
        <Card className="p-4 bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                <span className="font-semibold text-red-500">LIVE NOW</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {liveArtistIds.size === 1
                  ? "1 artist you follow is live!"
                  : `${liveArtistIds.size} artists you follow are live!`}
              </span>
            </div>
            <Button
              onClick={() => navigate('/explore')}
              variant="outline"
              size="sm"
              className="border-red-500/30 hover:bg-red-500/10 text-red-500"
            >
              Watch Now
            </Button>
          </div>
        </Card>
      )}

      {/* Following Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('fan.followingArtists').replace('{count}', String(followedArtistIds.length))}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/fan/following')}
        >
          {t('actions.seeAll')}
        </Button>
      </div>

      {/* Recommended For You */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('fan.recommendedForYou')}</h3>
        </div>
        
        <DiscoverArtists
          followedGenres={followedGenres}
          followedArtistIds={followedArtistIds}
          limit={9}
        />
      </Card>

      {/* Explore More */}
      <div className="text-center pt-4">
        <Button 
          onClick={() => navigate('/explore')} 
          className="bg-gradient-gold"
        >
          {t('fan.exploreMoreArtists')}
        </Button>
      </div>
    </div>
  );
}
