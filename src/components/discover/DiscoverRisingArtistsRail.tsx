import { useRisingArtists } from '@/hooks/useRisingArtists';
import { TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export function DiscoverRisingArtistsRail() {
  const { artists, loading } = useRisingArtists(7, 10);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Rising Artists
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-40 h-52 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (artists.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        Rising Artists
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {artists.map((artist) => {
          const growthPercent = artist.follower_count > 0
            ? Math.round((artist.new_followers / artist.follower_count) * 100)
            : 0;

          return (
            <Card
              key={artist.artist_id}
              className="w-40 flex-shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform border-primary/20 bg-card/50"
              onClick={() => navigate(`/artist/${artist.artist_id}`)}
            >
              {/* Avatar */}
              <div className="relative p-4 flex justify-center">
                <Avatar className="w-24 h-24 border-2 border-primary/50 ring-2 ring-primary/20">
                  <AvatarImage src={artist.artist_avatar || ''} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {artist.artist_name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Rising badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/90 text-primary-foreground text-xs">
                    Rising
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 pt-0 space-y-2 text-center">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {artist.artist_name}
                </h3>

                {artist.genre && (
                  <Badge variant="outline" className="text-xs border-primary/30">
                    {artist.genre}
                  </Badge>
                )}

                {/* Stats */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{artist.follower_count}</span>
                  </div>
                  {growthPercent > 0 && (
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{growthPercent}%</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
