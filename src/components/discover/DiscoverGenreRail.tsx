import { useGenreContent } from '@/hooks/useGenreContent';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Video } from 'lucide-react';
import { useState } from 'react';
import { ContentOverlay } from '@/components/fan/ContentOverlay';

interface DiscoverGenreRailProps {
  genre: string;
}

export function DiscoverGenreRail({ genre }: DiscoverGenreRailProps) {
  const { items, loading } = useGenreContent(genre, 10);
  const [overlayItem, setOverlayItem] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">{genre}</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-44 h-56 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-xl font-bold">{genre}</h3>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {items.map((item) => (
            <Card
              key={item.content_id}
              className="w-44 flex-shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform border-primary/10 bg-card/30"
              onClick={() => setOverlayItem(item)}
            >
              {/* Cover/Thumbnail */}
              <div className="relative aspect-square bg-muted">
                {item.content_type === 'video' ? (
                  <video
                    src={item.media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={item.cover_url || '/placeholder.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Content type badge */}
                <div className="absolute top-2 right-2">
                  {item.content_type === 'video' ? (
                    <Video className="w-4 h-4 text-white drop-shadow" />
                  ) : (
                    <Music className="w-4 h-4 text-white drop-shadow" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>

                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={item.artist_avatar || ''} />
                    <AvatarFallback className="text-xs">
                      {item.artist_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.artist_name}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {overlayItem && (
        <ContentOverlay
          isOpen={!!overlayItem}
          onClose={() => setOverlayItem(null)}
          item={{
            id: overlayItem.content_id,
            type: overlayItem.content_type,
            title: overlayItem.title,
            artistId: overlayItem.artist_id,
            artistName: overlayItem.artist_name,
            artistUserId: overlayItem.artist_user_id,
            mediaUrl: overlayItem.media_url,
            coverUrl: overlayItem.cover_url,
          }}
        />
      )}
    </>
  );
}
