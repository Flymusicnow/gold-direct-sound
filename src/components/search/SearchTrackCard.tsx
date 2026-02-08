import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music2, Sparkles } from 'lucide-react';
import { SearchResultHighlight } from './SearchResultHighlight';
import { FanActionBar } from '@/components/fan/FanActionBar';
import type { SearchTrack } from '@/hooks/useSearch';

interface SearchTrackCardProps {
  track: SearchTrack;
  query: string;
  onOpenOverlay?: () => void;
}

export function SearchTrackCard({ track, query, onOpenOverlay }: SearchTrackCardProps) {
  const flightdeckItem = {
    id: track.id,
    type: 'track' as const,
    title: track.title,
    artistId: track.artist_profiles.id,
    artistName: track.artist_profiles.artist_name,
    artistUserId: track.artist_profiles.user_id,
    mediaUrl: track.audio_url,
    coverUrl: track.cover_url || undefined,
    spotlightEntryId: track.spotlightEntryId,
    spotlightCampaignId: track.spotlightCampaignId,
  };

  return (
    <Card className="hover:shadow-lg hover:border-primary/30 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Cover Image */}
          <div 
            className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer isolate"
            style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
            onClick={onOpenOverlay}
          >
            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Music2 className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          {/* Track Info & Actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={onOpenOverlay}
              >
                <h3 className="font-semibold truncate text-base">
                  <SearchResultHighlight text={track.title} query={query} />
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist_profiles.artist_name}
                </p>
              </div>

              {track.isInActiveSpotlight && (
                <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Spotlight
                </Badge>
              )}
            </div>

            {track.genre && (
              <Badge variant="secondary" className="mb-2 text-xs bg-muted">
                {track.genre}
              </Badge>
            )}

            <FanActionBar
              item={flightdeckItem}
              variant="compact"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
