import { useEffect, useRef, useState } from 'react';
import { DiscoverVideoCard } from './DiscoverVideoCard';
import { useDiscoverFeed } from '@/hooks/useDiscoverFeed';
import { ContentOverlay } from '@/components/fan/ContentOverlay';
import { Loader2 } from 'lucide-react';

export function DiscoverForYouRail() {
  const { items, loading, hasMore, loadMore } = useDiscoverFeed(10);
  const [activeIndex, setActiveIndex] = useState(0);
  const [overlayItem, setOverlayItem] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(index);

            // Pre-fetch next batch when 70% scrolled
            if (hasMore && index >= items.length - 3) {
              loadMore();
            }
          }
        });
      },
      { threshold: 0.7 }
    );

    const cards = containerRef.current.querySelectorAll('[data-index]');
    cards.forEach((card) => observerRef.current?.observe(card));

    return () => observerRef.current?.disconnect();
  }, [items.length, hasMore, loadMore]);

  if (loading && items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h3 className="text-xl font-bold mb-2">No content yet</h3>
          <p className="text-muted-foreground">
            Follow artists to see personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {items.map((item, index) => (
          <div key={`${item.content_id}-${index}`} data-index={index}>
            <DiscoverVideoCard
              item={item}
              isInView={index === activeIndex}
              onOpenOverlay={() => setOverlayItem(item)}
            />
          </div>
        ))}

        {loading && (
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
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
