import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles } from 'lucide-react';
import { SearchResultHighlight } from './SearchResultHighlight';
import { useFollowArtist } from '@/hooks/useFollowArtist';
import type { SearchArtist } from '@/hooks/useSearch';

interface SearchArtistCardProps {
  artist: SearchArtist;
  query: string;
  hasActiveSpotlight?: boolean;
}

export function SearchArtistCard({ artist, query, hasActiveSpotlight }: SearchArtistCardProps) {
  const navigate = useNavigate();
  const { isFollowing, isUpdating, toggleFollow } = useFollowArtist(artist.id);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow();
  };

  return (
    <Card
      className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
      onClick={() => navigate(`/artist/${artist.user_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={artist.artist_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary/40 transition-colors"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <span className="text-2xl text-primary font-bold">
                {artist.artist_name[0]}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">
                <SearchResultHighlight text={artist.artist_name} query={query} />
              </h3>
              {hasActiveSpotlight && (
                <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Spotlight
                </Badge>
              )}
            </div>

            {artist.genre && (
              <Badge
                variant="secondary"
                className="mb-2 text-xs bg-primary/10 text-primary"
              >
                <SearchResultHighlight text={artist.genre} query={query} />
              </Badge>
            )}

            {(artist.city || artist.country) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>
                  {[artist.city, artist.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {artist.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {artist.bio}
              </p>
            )}

            <Button
              size="sm"
              variant={isFollowing ? 'secondary' : 'default'}
              onClick={handleFollowClick}
              disabled={isUpdating}
              className="w-full"
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
