import { useTrendingContent } from '@/hooks/useTrendingContent';
import { Flame, Music, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { ContentOverlay } from '@/components/fan/ContentOverlay';

export function DiscoverTrendingRail() {
  const { items, loading } = useTrendingContent(48, 10);
  const [overlayItem, setOverlayItem] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          Trending Now
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-48 h-64 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary animate-pulse" />
          Trending Now
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {items.map((item, index) => (
            <Card
              key={item.content_id}
              className="w-48 flex-shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform border-primary/20 bg-card/50"
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

                {/* Trending badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-primary/90 text-primary-foreground rounded-full text-xs font-bold">
                  <Flame className="w-3 h-3" />
                  #{index + 1}
                </div>

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
                <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>

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

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>▶ {item.plays}</span>
                  <span>❤ {item.likes}</span>
                  {item.spotlight_votes > 0 && (
                    <span>⭐ {item.spotlight_votes}</span>
                  )}
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
