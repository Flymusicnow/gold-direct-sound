import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { GlobalFeedFilters } from "@/components/feed/GlobalFeedFilters";
import { GlobalFeedCard } from "@/components/feed/GlobalFeedCard";
import { useGlobalFeed, FeedFilter } from "@/hooks/useGlobalFeed";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

function FeedCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export default function GlobalHomeFeed() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [followedArtistIds, setFollowedArtistIds] = useState<Set<string>>(new Set());
  const [hasNewContent, setHasNewContent] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { items, isLoading, isLoadingMore, hasMore, loadMore, refresh } = useGlobalFeed(filter);

  // Load followed artist IDs
  useEffect(() => {
    if (!user) return;
    supabase
      .from('follows')
      .select('artist_id')
      .eq('fan_id', user.id)
      .then(({ data }) => {
        if (data) setFollowedArtistIds(new Set(data.map(f => f.artist_id)));
      });
  }, [user]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !isLoadingMore && hasMore) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore, loadMore]);

  // Poll for new content every 60s
  useEffect(() => {
    const interval = setInterval(() => setHasNewContent(true), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setHasNewContent(false);
    refresh();
  };

  const handleFollow = useCallback((artistId: string) => {
    setFollowedArtistIds(prev => new Set([...prev, artistId]));
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <MobileFanNav />
      <div className="flex w-full pt-16 min-h-[100dvh]">
        <FanSidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-52 md:pb-8">

          {/* Sticky header + filters */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="px-4 pt-4 pb-1">
              <h1 className="text-xl font-bold tracking-tight">Home</h1>
              <p className="text-xs text-muted-foreground">Community updates from all artists</p>
            </div>
            <GlobalFeedFilters activeFilter={filter} onFilterChange={(f) => { setFilter(f); setHasNewContent(false); }} />
          </div>

          {/* New content pill */}
          <AnimatePresence>
            {hasNewContent && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex justify-center pt-3"
              >
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New content available
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed */}
          <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <FeedCardSkeleton key={i} />)
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No posts yet</p>
                <p className="text-sm mt-1">Check back soon — artists are warming up</p>
              </div>
            ) : (
              items.map((item, i) => (
                <GlobalFeedCard
                  key={item.id}
                  item={item}
                  index={i}
                  followedArtistIds={followedArtistIds}
                  onFollow={handleFollow}
                />
              ))
            )}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <p className="text-xs text-muted-foreground">You've seen everything · come back tomorrow</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNavBarFan />
    </div>
  );
}
