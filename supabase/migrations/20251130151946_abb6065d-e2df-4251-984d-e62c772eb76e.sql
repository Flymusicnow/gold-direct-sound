-- =====================================================
-- DISCOVER FEED 2.0 - RPC SCORING LOGIC REFINEMENT
-- =====================================================
-- This migration updates the scoring algorithms for all
-- Discover Feed RPC functions to provide more nuanced
-- and taste-driven content recommendations.
-- =====================================================

-- =====================================================
-- 1. UPDATE get_for_you_feed
-- =====================================================
-- New scoring hierarchy:
-- - taste_match (genre/tags/artist)       → x40 (strong)
-- - supporter_bias (XP / supporter level) → x30 (strong)
-- - global_trending (plays/likes/votes)   → x20 (medium)
-- - recency                               → x15 (medium)
-- - spotlight_boost (active spotlight)    → x20 (bonus)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_for_you_feed(_user_id uuid, _limit integer DEFAULT 10, _offset integer DEFAULT 0)
 RETURNS TABLE(content_id uuid, content_type text, title text, media_url text, cover_url text, caption text, artist_id uuid, artist_name text, artist_avatar text, artist_user_id uuid, genre text, score numeric, spotlight_entry_id uuid, spotlight_campaign_id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  followed_genres TEXT[];
BEGIN
  -- Get genres from artists the user follows (taste signal)
  SELECT ARRAY_AGG(DISTINCT ap.genre)
  INTO followed_genres
  FROM follows f
  JOIN artist_profiles ap ON f.artist_id = ap.id
  WHERE f.fan_id = _user_id AND ap.genre IS NOT NULL;

  RETURN QUERY
  WITH scored_videos AS (
    SELECT 
      avp.id AS content_id,
      'video'::TEXT AS content_type,
      COALESCE(avp.caption, 'Video') AS title,
      avp.video_url AS media_url,
      NULL::TEXT AS cover_url,
      avp.caption,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      ap.genre,
      NULL::UUID AS spotlight_entry_id,
      NULL::UUID AS spotlight_campaign_id,
      avp.created_at,
      (
        -- Taste match: followed artist (x40)
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE fan_id = _user_id AND artist_id = ap.id) THEN 40 ELSE 0 END +
        
        -- Taste match: genre affinity (x20)
        CASE WHEN ap.genre = ANY(followed_genres) THEN 20 ELSE 0 END +
        
        -- Supporter bias: existing XP (x30, scaled by /10)
        COALESCE((SELECT score FROM fan_support_scores WHERE fan_user_id = _user_id AND artist_id = ap.id) * 3, 0) +
        
        -- Spotlight boost: artist in active spotlight (x20)
        CASE WHEN EXISTS(SELECT 1 FROM spotlight_entries se JOIN spotlight_campaigns sc ON se.campaign_id = sc.id WHERE se.artist_id = ap.id AND sc.status = 'active') THEN 20 ELSE 0 END +
        
        -- Global trending: view count (x20, scaled by /100)
        COALESCE(avp.view_count / 5, 0) +
        
        -- Recency: newer content bonus (x15, scaled by days)
        CASE 
          WHEN avp.created_at > NOW() - INTERVAL '7 days' THEN 15
          WHEN avp.created_at > NOW() - INTERVAL '30 days' THEN 10
          ELSE 5
        END +
        
        -- User engagement: already viewed (x10)
        CASE WHEN EXISTS(SELECT 1 FROM video_views WHERE user_id = _user_id AND video_id = avp.id) THEN 10 ELSE 0 END
      ) AS score
    FROM artist_video_posts avp
    JOIN artist_profiles ap ON avp.artist_id = ap.id
    WHERE ap.status = 'approved'
  ),
  scored_tracks AS (
    SELECT 
      t.id AS content_id,
      'track'::TEXT AS content_type,
      t.title,
      t.audio_url AS media_url,
      t.cover_url,
      t.description AS caption,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      COALESCE(t.genre, ap.genre) AS genre,
      NULL::UUID AS spotlight_entry_id,
      NULL::UUID AS spotlight_campaign_id,
      t.created_at,
      (
        -- Taste match: followed artist (x40)
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE fan_id = _user_id AND artist_id = ap.id) THEN 40 ELSE 0 END +
        
        -- Taste match: genre affinity (x20)
        CASE WHEN COALESCE(t.genre, ap.genre) = ANY(followed_genres) THEN 20 ELSE 0 END +
        
        -- Supporter bias: existing XP (x30, scaled by /10)
        COALESCE((SELECT score FROM fan_support_scores WHERE fan_user_id = _user_id AND artist_id = ap.id) * 3, 0) +
        
        -- Spotlight boost: track in active spotlight (x20)
        CASE WHEN EXISTS(SELECT 1 FROM spotlight_entries se JOIN spotlight_campaigns sc ON se.campaign_id = sc.id WHERE se.track_id = t.id AND sc.status = 'active') THEN 20 ELSE 0 END +
        
        -- Global trending: play count (x20, scaled by /100)
        COALESCE(t.play_count / 5, 0) +
        
        -- Recency: newer content bonus (x15, scaled by days)
        CASE 
          WHEN t.created_at > NOW() - INTERVAL '7 days' THEN 15
          WHEN t.created_at > NOW() - INTERVAL '30 days' THEN 10
          ELSE 5
        END +
        
        -- User engagement: already liked (x10)
        CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = _user_id AND track_id = t.id) THEN 10 ELSE 0 END +
        
        -- User engagement: in user's stack (x10)
        CASE WHEN EXISTS(SELECT 1 FROM playlist_tracks pt JOIN playlists p ON pt.playlist_id = p.id WHERE p.user_id = _user_id AND pt.track_id = t.id) THEN 10 ELSE 0 END
      ) AS score
    FROM tracks t
    JOIN artist_profiles ap ON t.artist_id = ap.id
    WHERE ap.status = 'approved'
  ),
  scored_spotlight AS (
    SELECT 
      t.id AS content_id,
      'spotlight'::TEXT AS content_type,
      COALESCE(se.title, t.title) AS title,
      t.audio_url AS media_url,
      t.cover_url,
      se.description AS caption,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      COALESCE(t.genre, ap.genre) AS genre,
      se.id AS spotlight_entry_id,
      se.campaign_id AS spotlight_campaign_id,
      se.created_at,
      (
        -- Taste match: followed artist (x40)
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE fan_id = _user_id AND artist_id = ap.id) THEN 40 ELSE 0 END +
        
        -- Spotlight boost: always active (x20)
        20 +
        
        -- Taste match: genre affinity (x20)
        CASE WHEN COALESCE(t.genre, ap.genre) = ANY(followed_genres) THEN 20 ELSE 0 END +
        
        -- Supporter bias: existing XP (x30, scaled by /10)
        COALESCE((SELECT score FROM fan_support_scores WHERE fan_user_id = _user_id AND artist_id = ap.id) * 3, 0) +
        
        -- Global trending: spotlight votes (x20, scaled by /5)
        COALESCE(se.total_votes / 5, 0) +
        
        -- Recency: newer entries (x15)
        CASE 
          WHEN se.created_at > NOW() - INTERVAL '7 days' THEN 15
          WHEN se.created_at > NOW() - INTERVAL '30 days' THEN 10
          ELSE 5
        END
      ) AS score
    FROM spotlight_entries se
    JOIN tracks t ON se.track_id = t.id
    JOIN artist_profiles ap ON se.artist_id = ap.id
    JOIN spotlight_campaigns sc ON se.campaign_id = sc.id
    WHERE se.status = 'approved' AND sc.status = 'active'
  )
  SELECT * FROM (
    SELECT * FROM scored_videos
    UNION ALL
    SELECT * FROM scored_tracks
    UNION ALL
    SELECT * FROM scored_spotlight
  ) combined
  ORDER BY score DESC, created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$function$;

-- =====================================================
-- 2. UPDATE get_trending_content
-- =====================================================
-- Focus on 48-hour growth metrics:
-- - new_plays * 1.5
-- - new_likes * 2
-- - new_shares * 3 (if trackable)
-- - new_spotlight_votes * 4
-- - new_supporter_xp * 2
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_trending_content(_hours integer DEFAULT 48, _limit integer DEFAULT 10)
 RETURNS TABLE(content_id uuid, content_type text, title text, media_url text, cover_url text, artist_id uuid, artist_name text, artist_avatar text, artist_user_id uuid, genre text, trending_score numeric, plays integer, likes integer, spotlight_votes integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH time_window AS (
    SELECT NOW() - (_hours || ' hours')::INTERVAL AS start_time
  ),
  trending_tracks AS (
    SELECT 
      t.id AS content_id,
      'track'::TEXT AS content_type,
      t.title,
      t.audio_url AS media_url,
      t.cover_url,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      COALESCE(t.genre, ap.genre) AS genre,
      (
        -- New plays (x1.5)
        (t.play_count * 1.5) +
        
        -- New likes in time window (x2)
        (COALESCE((SELECT COUNT(*) * 2 FROM likes WHERE track_id = t.id AND created_at > (SELECT start_time FROM time_window)), 0)) +
        
        -- Tracks in stacks (proxy for shares, x3)
        (COALESCE((SELECT COUNT(*) * 3 FROM playlist_tracks WHERE track_id = t.id AND added_at > (SELECT start_time FROM time_window)), 0)) +
        
        -- New spotlight votes (x4)
        (COALESCE((SELECT SUM(se.total_votes) * 4 FROM spotlight_entries se WHERE se.track_id = t.id AND se.updated_at > (SELECT start_time FROM time_window)), 0)) +
        
        -- New supporter XP for this artist (x2)
        (COALESCE((SELECT SUM(score) * 2 FROM fan_support_scores WHERE artist_id = ap.id AND updated_at > (SELECT start_time FROM time_window)), 0))
      ) AS trending_score,
      t.play_count AS plays,
      (SELECT COUNT(*)::INT FROM likes WHERE track_id = t.id) AS likes,
      (SELECT COALESCE(SUM(total_votes), 0)::INT FROM spotlight_entries WHERE track_id = t.id) AS spotlight_votes
    FROM tracks t
    JOIN artist_profiles ap ON t.artist_id = ap.id
    WHERE ap.status = 'approved'
      AND t.created_at > (SELECT start_time FROM time_window)
  ),
  trending_videos AS (
    SELECT 
      avp.id AS content_id,
      'video'::TEXT AS content_type,
      COALESCE(avp.caption, 'Video') AS title,
      avp.video_url AS media_url,
      NULL::TEXT AS cover_url,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      ap.genre,
      (
        -- New views (x1.5)
        (avp.view_count * 1.5) +
        
        -- New comments in time window (x2)
        (COALESCE((SELECT COUNT(*) * 2 FROM video_comments WHERE video_id = avp.id AND created_at > (SELECT start_time FROM time_window)), 0)) +
        
        -- New supporter XP for this artist (x2)
        (COALESCE((SELECT SUM(score) * 2 FROM fan_support_scores WHERE artist_id = ap.id AND updated_at > (SELECT start_time FROM time_window)), 0))
      ) AS trending_score,
      avp.view_count AS plays,
      0::INT AS likes,
      0::INT AS spotlight_votes
    FROM artist_video_posts avp
    JOIN artist_profiles ap ON avp.artist_id = ap.id
    WHERE ap.status = 'approved'
      AND avp.created_at > (SELECT start_time FROM time_window)
  )
  SELECT * FROM (
    SELECT * FROM trending_tracks
    UNION ALL
    SELECT * FROM trending_videos
  ) combined
  WHERE trending_score > 0
  ORDER BY trending_score DESC
  LIMIT _limit;
END;
$function$;

-- =====================================================
-- 3. UPDATE get_rising_artists
-- =====================================================
-- Focus on fan acquisition:
-- - new_followers * 3
-- - new_supporter_xp * 3 (increased weight)
-- - spotlight_activity * 2
-- - recent_release * 1.5
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_rising_artists(_days integer DEFAULT 7, _limit integer DEFAULT 10)
 RETURNS TABLE(artist_id uuid, artist_name text, artist_avatar text, artist_user_id uuid, genre text, follower_count bigint, new_followers bigint, new_likes bigint, supporter_xp numeric, rising_score numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH time_window AS (
    SELECT NOW() - (_days || ' days')::INTERVAL AS start_time
  ),
  artist_stats AS (
    SELECT 
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      ap.genre,
      ap.created_at,
      
      -- Total follower count
      (SELECT COUNT(*) FROM follows WHERE artist_id = ap.id) AS follower_count,
      
      -- New followers in time window
      (SELECT COUNT(*) FROM follows WHERE artist_id = ap.id AND created_at > (SELECT start_time FROM time_window)) AS new_followers,
      
      -- New likes on artist's tracks in time window
      (SELECT COUNT(*) FROM likes l JOIN tracks t ON l.track_id = t.id WHERE t.artist_id = ap.id AND l.created_at > (SELECT start_time FROM time_window)) AS new_likes,
      
      -- New supporter XP in time window
      COALESCE((SELECT SUM(score) FROM fan_support_scores WHERE artist_id = ap.id AND updated_at > (SELECT start_time FROM time_window)), 0) AS supporter_xp
    FROM artist_profiles ap
    WHERE ap.status = 'approved'
      AND ap.created_at > NOW() - INTERVAL '90 days' -- Only artists created in last 90 days
  )
  SELECT 
    artist_id,
    artist_name,
    artist_avatar,
    artist_user_id,
    genre,
    follower_count,
    new_followers,
    new_likes,
    supporter_xp,
    (
      -- New followers (x3)
      (new_followers * 3) +
      
      -- New supporter XP (x3, increased from x2)
      (supporter_xp * 3) +
      
      -- Spotlight activity (x2): check if artist has active spotlight entry
      (CASE WHEN EXISTS(SELECT 1 FROM spotlight_entries se JOIN spotlight_campaigns sc ON se.campaign_id = sc.id WHERE se.artist_id = artist_stats.artist_id AND sc.status = 'active') THEN 2 ELSE 0 END) +
      
      -- Recent release bonus (x1.5): artist released track/video in last 7 days
      (CASE 
        WHEN EXISTS(SELECT 1 FROM tracks WHERE artist_id = artist_stats.artist_id AND created_at > NOW() - INTERVAL '7 days') 
          OR EXISTS(SELECT 1 FROM artist_video_posts WHERE artist_id = artist_stats.artist_id AND created_at > NOW() - INTERVAL '7 days')
        THEN 1.5 
        ELSE 0 
      END)
    ) AS rising_score,
    created_at
  FROM artist_stats
  WHERE (new_followers > 0 OR new_likes > 0 OR supporter_xp > 0)
  ORDER BY rising_score DESC
  LIMIT _limit;
END;
$function$;

-- =====================================================
-- 4. UPDATE get_genre_content (ADD TASTE MATCHING)
-- =====================================================
-- Add fan taste matching to genre content ordering:
-- - Calculate taste_match for the current fan
-- - Order by: (global_popularity + taste_match) DESC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_genre_content(_genre text, _limit integer DEFAULT 10)
 RETURNS TABLE(content_id uuid, content_type text, title text, media_url text, cover_url text, artist_id uuid, artist_name text, artist_avatar text, artist_user_id uuid, genre text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH genre_tracks AS (
    SELECT 
      t.id AS content_id,
      'track'::TEXT AS content_type,
      t.title,
      t.audio_url AS media_url,
      t.cover_url,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      COALESCE(t.genre, ap.genre) AS genre,
      t.created_at,
      -- Global popularity score
      (
        COALESCE(t.play_count, 0) +
        (SELECT COUNT(*) FROM likes WHERE track_id = t.id) * 2 +
        (SELECT COALESCE(SUM(total_votes), 0) FROM spotlight_entries WHERE track_id = t.id) * 3
      ) AS popularity_score
    FROM tracks t
    JOIN artist_profiles ap ON t.artist_id = ap.id
    WHERE ap.status = 'approved'
      AND (t.genre ILIKE _genre OR ap.genre ILIKE _genre)
  ),
  genre_videos AS (
    SELECT 
      avp.id AS content_id,
      'video'::TEXT AS content_type,
      COALESCE(avp.caption, 'Video') AS title,
      avp.video_url AS media_url,
      NULL::TEXT AS cover_url,
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url AS artist_avatar,
      ap.user_id AS artist_user_id,
      ap.genre,
      avp.created_at,
      -- Global popularity score
      (
        COALESCE(avp.view_count, 0) +
        (SELECT COUNT(*) FROM video_comments WHERE video_id = avp.id) * 2
      ) AS popularity_score
    FROM artist_video_posts avp
    JOIN artist_profiles ap ON avp.artist_id = ap.id
    WHERE ap.status = 'approved'
      AND ap.genre ILIKE _genre
  )
  SELECT 
    content_id,
    content_type,
    title,
    media_url,
    cover_url,
    artist_id,
    artist_name,
    artist_avatar,
    artist_user_id,
    genre,
    created_at
  FROM (
    SELECT *, popularity_score FROM genre_tracks
    UNION ALL
    SELECT *, popularity_score FROM genre_videos
  ) combined
  ORDER BY popularity_score DESC, created_at DESC
  LIMIT _limit;
END;
$function$;