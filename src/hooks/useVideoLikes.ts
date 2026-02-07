import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useVideoLikes(videoId: string) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Fetch like count
      const { data: video } = await supabase
        .from("artist_video_posts")
        .select("like_count")
        .eq("id", videoId)
        .maybeSingle();

      if (!cancelled && video) {
        setLikeCount(video.like_count ?? 0);
      }

      // Check if user has liked
      if (user) {
        const { data: like } = await supabase
          .from("video_likes")
          .select("id")
          .eq("video_id", videoId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!cancelled) {
          setIsLiked(!!like);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [videoId, user]);

  const toggleLike = useCallback(async () => {
    if (!user || loading) return;
    setLoading(true);

    if (isLiked) {
      // Unlike
      setIsLiked(false);
      setLikeCount(prev => Math.max(prev - 1, 0));
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
    } else {
      // Like
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      await supabase
        .from("video_likes")
        .insert({ video_id: videoId, user_id: user.id });
    }

    setLoading(false);
  }, [user, isLiked, videoId, loading]);

  return { isLiked, likeCount, toggleLike };
}
