-- =====================================================
-- Taste Engine V1.5: Enhanced Taste Profile System
-- =====================================================

-- Drop and recreate update_taste_profile with normalized weights
DROP FUNCTION IF EXISTS public.update_taste_profile(uuid, uuid, text, uuid, uuid);

CREATE OR REPLACE FUNCTION public.update_taste_profile(
  _fan_user_id uuid,
  _artist_id uuid,
  _interaction text,
  _track_id uuid DEFAULT NULL,
  _video_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_genre TEXT;
  v_weight INTEGER;
BEGIN
  -- =====================================================
  -- Taste Engine V1.5 Normalized Interaction Weights
  -- =====================================================
  -- LIKE track/video         → +5 (medium engagement)
  -- PLAY (full play)         → +2 (passive engagement)
  -- ADD TO STACK             → +10 (active curation)
  -- FOLLOW artist            → +8 (strong commitment, upgraded from +3)
  -- SPOTLIGHT VOTE           → +12 (high commitment, upgraded from +15)
  -- SHARE                    → +10 (amplification, upgraded from +7)
  -- COMMENT                  → +4 (community engagement)
  -- WATCH VIDEO (>50%)       → +3 (video engagement, new)
  -- =====================================================
  
  v_weight := CASE _interaction
    WHEN 'like' THEN 5
    WHEN 'play' THEN 2
    WHEN 'stack_add' THEN 10
    WHEN 'follow' THEN 8          -- upgraded from 3
    WHEN 'spotlight_vote' THEN 12 -- adjusted from 15
    WHEN 'share' THEN 10           -- upgraded from 7
    WHEN 'comment' THEN 4
    WHEN 'watch_video' THEN 3      -- new
    ELSE 1
  END;
  
  -- Get genre from track, video, or artist
  IF _track_id IS NOT NULL THEN
    SELECT COALESCE(t.genre, ap.genre) INTO v_genre
    FROM tracks t
    JOIN artist_profiles ap ON t.artist_id = ap.id
    WHERE t.id = _track_id;
  ELSIF _video_id IS NOT NULL THEN
    SELECT ap.genre INTO v_genre
    FROM artist_video_posts avp
    JOIN artist_profiles ap ON avp.artist_id = ap.id
    WHERE avp.id = _video_id;
  ELSE
    SELECT genre INTO v_genre
    FROM artist_profiles
    WHERE id = _artist_id;
  END IF;
  
  -- Insert or update taste profile
  INSERT INTO fan_taste_profile (fan_user_id, genres, top_artists, last_updated)
  VALUES (
    _fan_user_id,
    jsonb_build_object(v_genre, v_weight),
    jsonb_build_array(jsonb_build_object('artist_id', _artist_id, 'affinity', v_weight)),
    NOW()
  )
  ON CONFLICT (fan_user_id) DO UPDATE SET
    genres = COALESCE(fan_taste_profile.genres, '{}'::jsonb) || 
             jsonb_build_object(
               v_genre,
               COALESCE((fan_taste_profile.genres->>v_genre)::int, 0) + v_weight
             ),
    top_artists = (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'artist_id' = _artist_id::text 
          THEN jsonb_build_object(
            'artist_id', _artist_id,
            'affinity', COALESCE((elem->>'affinity')::int, 0) + v_weight
          )
          ELSE elem
        END
      )
      FROM jsonb_array_elements(COALESCE(fan_taste_profile.top_artists, '[]'::jsonb)) elem
    ) || CASE
      WHEN NOT EXISTS(
        SELECT 1 FROM jsonb_array_elements(COALESCE(fan_taste_profile.top_artists, '[]'::jsonb)) elem
        WHERE elem->>'artist_id' = _artist_id::text
      )
      THEN jsonb_build_array(jsonb_build_object('artist_id', _artist_id, 'affinity', v_weight))
      ELSE '[]'::jsonb
    END,
    last_updated = NOW();
END;
$function$;

-- Enhance calculate_taste_score with tag support
DROP FUNCTION IF EXISTS public.calculate_taste_score(uuid, uuid, text, text[]);

CREATE OR REPLACE FUNCTION public.calculate_taste_score(
  _fan_user_id uuid,
  _artist_id uuid,
  _genre text,
  _tags text[] DEFAULT '{}'::text[]
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_score INTEGER := 0;
  v_genre_affinity INTEGER;
  v_artist_affinity INTEGER;
  v_tag_score INTEGER := 0;
  v_profile RECORD;
  v_tag TEXT;
BEGIN
  -- Get taste profile
  SELECT * INTO v_profile
  FROM fan_taste_profile
  WHERE fan_user_id = _fan_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check artist affinity (max 40 points)
  SELECT COALESCE((elem->>'affinity')::int, 0) INTO v_artist_affinity
  FROM jsonb_array_elements(v_profile.top_artists) elem
  WHERE elem->>'artist_id' = _artist_id::text;
  
  v_score := v_score + LEAST(COALESCE(v_artist_affinity, 0), 40);
  
  -- Check genre match (max 30 points)
  v_genre_affinity := COALESCE((v_profile.genres->>_genre)::int, 0);
  v_score := v_score + LEAST(v_genre_affinity, 30);
  
  -- Check tag overlap (max 20 points, new in V1.5)
  IF array_length(_tags, 1) > 0 THEN
    FOREACH v_tag IN ARRAY _tags
    LOOP
      v_tag_score := v_tag_score + COALESCE((v_profile.top_tags->>v_tag)::int, 0);
    END LOOP;
    v_score := v_score + LEAST(v_tag_score, 20);
  END IF;
  
  -- Add small bonus for recent activity (max 10 points)
  IF v_profile.last_updated > NOW() - INTERVAL '7 days' THEN
    v_score := v_score + 10;
  ELSIF v_profile.last_updated > NOW() - INTERVAL '30 days' THEN
    v_score := v_score + 5;
  END IF;
  
  -- Normalize to 0-100
  RETURN LEAST(v_score, 100);
END;
$function$;