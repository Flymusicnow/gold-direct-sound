import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FeedFilter = 'all' | 'posts' | 'videos' | 'new_artists' | 'trending';

export interface GlobalFeedItem {
  id: string;
  type: 'post' | 'video';
  createdAt: string;
  artistId: string;
  artistName: string;
  artistAvatar: string | null;
  artistUserId: string;
  artistCreatedAt: string;
  // Post-specific
  content?: string;
  mediaUrls?: string[];
  reactionCount?: number;
  commentCount?: number;
  // Video-specific
  videoUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  likeCount?: number;
  viewCount?: number;
}

const PAGE_SIZE = 20;

export function useGlobalFeed(filter: FeedFilter) {
  const [items, setItems] = useState<GlobalFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchFeed = useCallback(async (pageNum: number, reset = false) => {
    if (pageNum === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const offset = pageNum * PAGE_SIZE;
      const trendingCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const newArtistCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      let posts: GlobalFeedItem[] = [];
      let videos: GlobalFeedItem[] = [];

      // Fetch posts
      if (filter === 'all' || filter === 'posts' || filter === 'trending' || filter === 'new_artists') {
        let postsQuery = supabase
          .from('community_posts')
          .select('id, content, media_urls, created_at, reaction_count, comment_count, communities!inner(artist_id, artist_profiles!inner(id, artist_name, avatar_url, user_id, created_at))')
          .eq('tier_required', 'free')
          .eq('is_archived', false);

        if (filter === 'trending') {
          postsQuery = postsQuery
            .gte('created_at', trendingCutoff)
            .order('reaction_count', { ascending: false });
        } else if (filter === 'new_artists') {
          // will filter client side
          postsQuery = postsQuery.order('created_at', { ascending: false });
        } else {
          postsQuery = postsQuery.order('created_at', { ascending: false });
        }

        postsQuery = postsQuery.range(offset, offset + PAGE_SIZE - 1);

        const { data: postsData } = await postsQuery;

        if (postsData) {
          posts = postsData
            .filter((p: any) => {
              if (filter === 'new_artists') {
                return p.communities?.artist_profiles?.created_at >= newArtistCutoff;
              }
              return true;
            })
            .map((p: any) => ({
              id: `post_${p.id}`,
              type: 'post' as const,
              createdAt: p.created_at,
              artistId: p.communities?.artist_id ?? '',
              artistName: p.communities?.artist_profiles?.artist_name ?? 'Unknown Artist',
              artistAvatar: p.communities?.artist_profiles?.avatar_url ?? null,
              artistUserId: p.communities?.artist_profiles?.user_id ?? '',
              artistCreatedAt: p.communities?.artist_profiles?.created_at ?? '',
              content: p.content,
              mediaUrls: Array.isArray(p.media_urls) ? p.media_urls as string[] : [],
              reactionCount: p.reaction_count ?? 0,
              commentCount: p.comment_count ?? 0,
            }));
        }
      }

      // Fetch videos
      if (filter === 'all' || filter === 'videos' || filter === 'trending' || filter === 'new_artists') {
        let videosQuery = supabase
          .from('artist_video_posts')
          .select('id, video_url, caption, thumbnail_url, like_count, view_count, created_at, artist_profiles!inner(id, artist_name, avatar_url, user_id, created_at)');

        if (filter === 'trending') {
          videosQuery = videosQuery
            .gte('created_at', trendingCutoff)
            .order('like_count', { ascending: false });
        } else {
          videosQuery = videosQuery.order('created_at', { ascending: false });
        }

        videosQuery = videosQuery.range(offset, offset + PAGE_SIZE - 1);

        const { data: videosData } = await videosQuery;

        if (videosData) {
          videos = videosData
            .filter((v: any) => {
              if (filter === 'new_artists') {
                return v.artist_profiles?.created_at >= newArtistCutoff;
              }
              return true;
            })
            .map((v: any) => ({
              id: `video_${v.id}`,
              type: 'video' as const,
              createdAt: v.created_at,
              artistId: v.artist_profiles?.id ?? '',
              artistName: v.artist_profiles?.artist_name ?? 'Unknown Artist',
              artistAvatar: v.artist_profiles?.avatar_url ?? null,
              artistUserId: v.artist_profiles?.user_id ?? '',
              artistCreatedAt: v.artist_profiles?.created_at ?? '',
              videoUrl: v.video_url,
              thumbnailUrl: v.thumbnail_url ?? null,
              caption: v.caption ?? '',
              likeCount: v.like_count ?? 0,
              viewCount: v.view_count ?? 0,
            }));
        }
      }

      // Merge + sort by createdAt DESC
      let merged: GlobalFeedItem[] = [];
      if (filter === 'posts') {
        merged = posts;
      } else if (filter === 'videos') {
        merged = videos;
      } else if (filter === 'trending') {
        // interleave by score (already sorted) — just merge and sort
        merged = [...posts, ...videos].sort((a, b) => {
          const scoreA = (a.reactionCount ?? 0) + (a.commentCount ?? 0) + (a.likeCount ?? 0) + (a.viewCount ?? 0);
          const scoreB = (b.reactionCount ?? 0) + (b.commentCount ?? 0) + (b.likeCount ?? 0) + (b.viewCount ?? 0);
          return scoreB - scoreA;
        });
      } else {
        merged = [...posts, ...videos].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      const limited = merged.slice(0, PAGE_SIZE);

      if (reset || pageNum === 0) {
        setItems(limited);
      } else {
        setItems(prev => [...prev, ...limited]);
      }

      setHasMore(limited.length === PAGE_SIZE);
    } catch (err) {
      console.error('useGlobalFeed error:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter]);

  // Reset on filter change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchFeed(0, true);
  }, [filter]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  }, [isLoadingMore, hasMore, page, fetchFeed]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchFeed(0, true);
  }, [fetchFeed]);

  return { items, isLoading, isLoadingMore, hasMore, loadMore, refresh };
}
