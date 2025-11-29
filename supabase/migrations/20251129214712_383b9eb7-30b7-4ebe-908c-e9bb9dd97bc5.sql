-- Discover Feed 2.0: Server-side scoring functions for personalized content discovery

-- Function 1: Get personalized "For You" feed with weighted scoring
CREATE OR REPLACE FUNCTION get_for_you_feed(
  _user_id UUID,
  _limit INT DEFAULT 10,
  _offset INT DEFAULT 0
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  title TEXT,
  media_url TEXT,
  cover_url TEXT,
  caption TEXT,
  artist_id UUID,
  artist_name TEXT,
  artist_avatar TEXT,
  artist_user_id UUID,
  genre TEXT,
  score NUMERIC,
  spotlight_entry_id UUID,
  spotlight_campaign_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  followed_genres TEXT[];
BEGIN
  -- Get genres from artists the user follows
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
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE fan_id = _user_id AND artist_id = ap.id) THEN 40 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM spotlight_entries se JOIN spotlight_campaigns sc ON se.campaign_id = sc.id WHERE se.artist_id = ap.id AND sc.status = 'active') THEN 20 ELSE 0 END +
        CASE WHEN ap.genre = ANY(followed_genres) THEN 20 ELSE 0 END +
        COALESCE((SELECT score FROM fan_support_scores WHERE fan_user_id = _user_id AND artist_id = ap.id) / 10, 0) +
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
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE fan_id = _user_id AND artist_id = ap.id) THEN 40 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM spotlight_entries se JOIN spotlight_campaigns sc ON se.campaign_id = sc.id WHERE se.track_id = t.id AND sc.status = 'active') THEN 20 ELSE 0 END +
        CASE WHEN COALESCE(t.genre, ap.genre) = ANY(followed_genres) THEN 20 ELSE 0 END +
        COALESCE((SELECT score FROM fan_support_scores WHERE fan_user_id = _user_id AND artist_id = ap.id) / 10, 0) +
        CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = _user_id AND track_id = t.id) THEN 10 ELSE 0 END +
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
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE fan_id = _user_id AND artist_id = ap.id) THEN 40 ELSE 0 END +
        30 + -- Spotlight boost
        CASE WHEN COALESCE(t.genre, ap.genre) = ANY(followed_genres) THEN 20 ELSE 0 END +
        COALESCE((SELECT score FROM fan_support_scores WHERE fan_user_id = _user_id AND artist_id = ap.id) / 10, 0) +
        COALESCE(se.total_votes / 5, 0)
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
$$;

-- Function 2: Get trending content from last 48 hours
CREATE OR REPLACE FUNCTION get_trending_content(
  _hours INT DEFAULT 48,
  _limit INT DEFAULT 10
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  title TEXT,
  media_url TEXT,
  cover_url TEXT,
  artist_id UUID,
  artist_name TEXT,
  artist_avatar TEXT,
  artist_user_id UUID,
  genre TEXT,
  trending_score NUMERIC,
  plays INT,
  likes INT,
  spotlight_votes INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
        (t.play_count * 1.5) +
        (COALESCE((SELECT COUNT(*) FROM likes WHERE track_id = t.id), 0) * 2) +
        (COALESCE((SELECT COUNT(*) FROM playlist_tracks WHERE track_id = t.id), 0) * 3) +
        (COALESCE((SELECT SUM(total_votes) FROM spotlight_entries WHERE track_id = t.id), 0) * 4)
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
        (avp.view_count * 1.5) +
        (COALESCE((SELECT COUNT(*) FROM video_comments WHERE video_id = avp.id), 0) * 2)
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
$$;

-- Function 3: Get rising artists (new artists gaining traction)
CREATE OR REPLACE FUNCTION get_rising_artists(
  _days INT DEFAULT 7,
  _limit INT DEFAULT 10
)
RETURNS TABLE (
  artist_id UUID,
  artist_name TEXT,
  artist_avatar TEXT,
  artist_user_id UUID,
  genre TEXT,
  follower_count BIGINT,
  new_followers BIGINT,
  new_likes BIGINT,
  supporter_xp NUMERIC,
  rising_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      (SELECT COUNT(*) FROM follows WHERE artist_id = ap.id) AS follower_count,
      (SELECT COUNT(*) FROM follows WHERE artist_id = ap.id AND created_at > (SELECT start_time FROM time_window)) AS new_followers,
      (SELECT COUNT(*) FROM likes l JOIN tracks t ON l.track_id = t.id WHERE t.artist_id = ap.id AND l.created_at > (SELECT start_time FROM time_window)) AS new_likes,
      COALESCE((SELECT SUM(score) FROM fan_support_scores WHERE artist_id = ap.id AND updated_at > (SELECT start_time FROM time_window)), 0) AS supporter_xp
    FROM artist_profiles ap
    WHERE ap.status = 'approved'
      AND ap.created_at > NOW() - INTERVAL '90 days'
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
      (new_followers * 3) +
      (new_likes * 1.5) +
      (supporter_xp * 2)
    ) AS rising_score,
    created_at
  FROM artist_stats
  WHERE (new_followers > 0 OR new_likes > 0 OR supporter_xp > 0)
  ORDER BY rising_score DESC
  LIMIT _limit;
END;
$$;

-- Function 4: Get content by genre/vibe
CREATE OR REPLACE FUNCTION get_genre_content(
  _genre TEXT,
  _limit INT DEFAULT 10
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  title TEXT,
  media_url TEXT,
  cover_url TEXT,
  artist_id UUID,
  artist_name TEXT,
  artist_avatar TEXT,
  artist_user_id UUID,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      t.created_at
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
      avp.created_at
    FROM artist_video_posts avp
    JOIN artist_profiles ap ON avp.artist_id = ap.id
    WHERE ap.status = 'approved'
      AND ap.genre ILIKE _genre
  )
  SELECT * FROM (
    SELECT * FROM genre_tracks
    UNION ALL
    SELECT * FROM genre_videos
  ) combined
  ORDER BY created_at DESC
  LIMIT _limit;
END;
$$;