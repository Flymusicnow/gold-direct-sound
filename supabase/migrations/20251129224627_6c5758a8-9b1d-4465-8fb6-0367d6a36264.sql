-- =============================================
-- PHASE 1: TASTE ENGINE V1 - Fixed function signatures
-- =============================================

-- Fan taste profile table
CREATE TABLE fan_taste_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  genres JSONB DEFAULT '{}',
  moods JSONB DEFAULT '{}',
  top_artists JSONB DEFAULT '[]',
  top_tags JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE fan_taste_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own taste profile"
  ON fan_taste_profile FOR SELECT
  USING (auth.uid() = fan_user_id);

CREATE POLICY "Users can insert own taste profile"
  ON fan_taste_profile FOR INSERT
  WITH CHECK (auth.uid() = fan_user_id);

CREATE POLICY "Users can update own taste profile"
  ON fan_taste_profile FOR UPDATE
  USING (auth.uid() = fan_user_id);

-- Update taste profile function (fixed parameter order)
CREATE OR REPLACE FUNCTION update_taste_profile(
  _fan_user_id UUID,
  _artist_id UUID,
  _interaction TEXT,
  _track_id UUID DEFAULT NULL,
  _video_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_genre TEXT;
  v_weight INTEGER;
BEGIN
  -- Define interaction weights
  v_weight := CASE _interaction
    WHEN 'like' THEN 5
    WHEN 'play' THEN 2
    WHEN 'stack_add' THEN 10
    WHEN 'share' THEN 7
    WHEN 'follow' THEN 3
    WHEN 'spotlight_vote' THEN 15
    WHEN 'comment' THEN 4
    ELSE 1
  END;
  
  -- Get genre from track or artist
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
  INSERT INTO fan_taste_profile (fan_user_id, genres, top_artists)
  VALUES (
    _fan_user_id,
    jsonb_build_object(v_genre, v_weight),
    jsonb_build_array(jsonb_build_object('artist_id', _artist_id, 'affinity', v_weight))
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
$$;

-- Calculate taste score function
CREATE OR REPLACE FUNCTION calculate_taste_score(
  _fan_user_id UUID,
  _artist_id UUID,
  _genre TEXT,
  _tags TEXT[] DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_genre_affinity INTEGER;
  v_artist_affinity INTEGER;
  v_profile RECORD;
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
  
  -- Normalize to 0-100
  RETURN LEAST(v_score, 100);
END;
$$;