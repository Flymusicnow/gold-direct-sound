
-- =====================================================
-- FLYMUSIC COLLAB ECOSYSTEM - DATABASE FOUNDATION
-- =====================================================

-- 1. COLLAB ENTITIES TABLE (Brands, Festivals, Sponsors, Event Agencies)
CREATE TABLE public.collab_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('brand', 'festival', 'sponsor', 'event_agency')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  location TEXT,
  mission TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  style_tags TEXT[] DEFAULT '{}',
  collab_types TEXT[] DEFAULT '{}',
  budget_range TEXT CHECK (budget_range IN ('low', 'medium', 'high')),
  brand_values TEXT,
  avoid_categories TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. COLLAB ENTITY ADMINS TABLE (Multi-admin support)
CREATE TABLE public.collab_entity_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_entity_id UUID NOT NULL REFERENCES public.collab_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (collab_entity_id, user_id)
);

-- 3. COLLAB OPPORTUNITIES TABLE
CREATE TABLE public.collab_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_entity_id UUID NOT NULL REFERENCES public.collab_entities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('festival_slot', 'brand_deal', 'ugc_content', 'sponsorship', 'live_event', 'partnership')),
  location TEXT,
  remote_ok BOOLEAN DEFAULT false,
  genres TEXT[] DEFAULT '{}',
  min_xp_level TEXT,
  min_supporters INTEGER DEFAULT 0,
  budget_range TEXT CHECK (budget_range IN ('low', 'medium', 'high')),
  application_deadline TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ARTIST PRESSKITS TABLE
CREATE TABLE public.artist_presskits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  tagline TEXT,
  bio_short TEXT,
  bio_long TEXT,
  location TEXT,
  contact_email TEXT,
  tech_info TEXT,
  brand_tags TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (artist_id, slug)
);

-- 5. ARTIST PRESSKIT MEDIA TABLE
CREATE TABLE public.artist_presskit_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presskit_id UUID NOT NULL REFERENCES public.artist_presskits(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'link')),
  url TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. COLLAB APPLICATIONS TABLE
CREATE TABLE public.collab_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.collab_opportunities(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  presskit_id UUID REFERENCES public.artist_presskits(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'shortlisted', 'accepted', 'rejected')),
  match_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (opportunity_id, artist_id)
);

-- 7. COLLAB INTEREST TABLE (Entity expressing interest in artists)
CREATE TABLE public.collab_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_entity_id UUID NOT NULL REFERENCES public.collab_entities(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'match_engine')),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (collab_entity_id, artist_id)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.collab_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_entity_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_presskits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_presskit_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_interest ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Check if user is collab entity admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_collab_entity_admin(_user_id UUID, _entity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collab_entity_admins
    WHERE user_id = _user_id AND collab_entity_id = _entity_id
  )
$$;

-- =====================================================
-- RLS POLICIES - COLLAB ENTITIES
-- =====================================================

-- Anyone can view active collab entities
CREATE POLICY "Anyone can view active collab entities"
ON public.collab_entities FOR SELECT
USING (is_active = true);

-- Admins can view all collab entities
CREATE POLICY "Admins can view all collab entities"
ON public.collab_entities FOR SELECT
USING (is_admin());

-- Admins can create collab entities
CREATE POLICY "Admins can create collab entities"
ON public.collab_entities FOR INSERT
WITH CHECK (is_admin());

-- Admins can update collab entities
CREATE POLICY "Admins can update collab entities"
ON public.collab_entities FOR UPDATE
USING (is_admin());

-- Admins can delete collab entities
CREATE POLICY "Admins can delete collab entities"
ON public.collab_entities FOR DELETE
USING (is_admin());

-- =====================================================
-- RLS POLICIES - COLLAB ENTITY ADMINS
-- =====================================================

-- Entity admins can view their memberships
CREATE POLICY "Entity admins can view own memberships"
ON public.collab_entity_admins FOR SELECT
USING (user_id = auth.uid());

-- Platform admins can view all entity admins
CREATE POLICY "Platform admins can view all entity admins"
ON public.collab_entity_admins FOR SELECT
USING (is_admin());

-- Platform admins can manage entity admins
CREATE POLICY "Platform admins can manage entity admins"
ON public.collab_entity_admins FOR ALL
USING (is_admin());

-- =====================================================
-- RLS POLICIES - COLLAB OPPORTUNITIES
-- =====================================================

-- Anyone authenticated can view active opportunities
CREATE POLICY "Authenticated users can view active opportunities"
ON public.collab_opportunities FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can view all opportunities
CREATE POLICY "Admins can view all opportunities"
ON public.collab_opportunities FOR SELECT
USING (is_admin());

-- Entity admins can manage their opportunities
CREATE POLICY "Entity admins can manage opportunities"
ON public.collab_opportunities FOR ALL
USING (is_collab_entity_admin(auth.uid(), collab_entity_id) OR is_admin());

-- =====================================================
-- RLS POLICIES - ARTIST PRESSKITS
-- =====================================================

-- Artists can manage their own presskits
CREATE POLICY "Artists can manage own presskits"
ON public.artist_presskits FOR ALL
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE id = artist_presskits.artist_id AND user_id = auth.uid()
));

-- Anyone can view presskits (public EPK)
CREATE POLICY "Anyone can view presskits"
ON public.artist_presskits FOR SELECT
USING (true);

-- =====================================================
-- RLS POLICIES - ARTIST PRESSKIT MEDIA
-- =====================================================

-- Artists can manage their presskit media
CREATE POLICY "Artists can manage presskit media"
ON public.artist_presskit_media FOR ALL
USING (EXISTS (
  SELECT 1 FROM artist_presskits pk
  JOIN artist_profiles ap ON pk.artist_id = ap.id
  WHERE pk.id = artist_presskit_media.presskit_id AND ap.user_id = auth.uid()
));

-- Anyone can view presskit media
CREATE POLICY "Anyone can view presskit media"
ON public.artist_presskit_media FOR SELECT
USING (true);

-- =====================================================
-- RLS POLICIES - COLLAB APPLICATIONS
-- =====================================================

-- Artists can manage their own applications
CREATE POLICY "Artists can manage own applications"
ON public.collab_applications FOR ALL
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE id = collab_applications.artist_id AND user_id = auth.uid()
));

-- Entity admins can view applications for their opportunities
CREATE POLICY "Entity admins can view applications"
ON public.collab_applications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM collab_opportunities co
  WHERE co.id = collab_applications.opportunity_id 
  AND is_collab_entity_admin(auth.uid(), co.collab_entity_id)
));

-- Entity admins can update application status
CREATE POLICY "Entity admins can update applications"
ON public.collab_applications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM collab_opportunities co
  WHERE co.id = collab_applications.opportunity_id 
  AND is_collab_entity_admin(auth.uid(), co.collab_entity_id)
));

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.collab_applications FOR SELECT
USING (is_admin());

-- =====================================================
-- RLS POLICIES - COLLAB INTEREST
-- =====================================================

-- Entity admins can manage interest records
CREATE POLICY "Entity admins can manage interest"
ON public.collab_interest FOR ALL
USING (is_collab_entity_admin(auth.uid(), collab_entity_id) OR is_admin());

-- Artists can view interest in them
CREATE POLICY "Artists can view interest in them"
ON public.collab_interest FOR SELECT
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE id = collab_interest.artist_id AND user_id = auth.uid()
));

-- =====================================================
-- MATCHMAKING RPC FUNCTION: Calculate Artist Match Score
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_artist_match_score(
  _artist_id UUID,
  _collab_entity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist RECORD;
  v_entity RECORD;
  v_genre_score INTEGER := 0;
  v_location_score INTEGER := 0;
  v_xp_score INTEGER := 0;
  v_supporters_score INTEGER := 0;
  v_collab_type_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_supporter_count INTEGER := 0;
  v_total_xp NUMERIC := 0;
BEGIN
  -- Get artist data
  SELECT * INTO v_artist FROM artist_profiles WHERE id = _artist_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Artist not found');
  END IF;
  
  -- Get entity data
  SELECT * INTO v_entity FROM collab_entities WHERE id = _collab_entity_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Collab entity not found');
  END IF;
  
  -- Get supporter count (followers)
  SELECT COUNT(*) INTO v_supporter_count FROM follows WHERE artist_id = _artist_id;
  
  -- Get total XP
  SELECT COALESCE(SUM(score), 0) INTO v_total_xp FROM fan_support_scores WHERE artist_id = _artist_id;
  
  -- GENRE/STYLE MATCH (40 pts max)
  -- Check if artist genre matches any entity style tags
  IF v_artist.genre IS NOT NULL AND v_entity.style_tags IS NOT NULL THEN
    IF v_artist.genre = ANY(v_entity.style_tags) THEN
      v_genre_score := 40;
    ELSIF EXISTS (
      SELECT 1 FROM unnest(v_entity.style_tags) tag 
      WHERE LOWER(v_artist.genre) LIKE '%' || LOWER(tag) || '%'
    ) THEN
      v_genre_score := 25;
    ELSE
      v_genre_score := 5; -- Base score for having a genre
    END IF;
  END IF;
  
  -- LOCATION RELEVANCE (15 pts max)
  IF v_artist.city IS NOT NULL AND v_entity.location IS NOT NULL THEN
    IF LOWER(v_artist.city) = LOWER(v_entity.location) THEN
      v_location_score := 15;
    ELSIF v_artist.country IS NOT NULL AND LOWER(v_artist.country) = LOWER(v_entity.location) THEN
      v_location_score := 10;
    ELSE
      v_location_score := 5; -- Has location data
    END IF;
  END IF;
  
  -- XP LEVEL (15 pts max)
  IF v_total_xp >= 500 THEN
    v_xp_score := 15;
  ELSIF v_total_xp >= 200 THEN
    v_xp_score := 12;
  ELSIF v_total_xp >= 100 THEN
    v_xp_score := 9;
  ELSIF v_total_xp >= 50 THEN
    v_xp_score := 6;
  ELSIF v_total_xp > 0 THEN
    v_xp_score := 3;
  END IF;
  
  -- SUPPORTER COUNT (15 pts max)
  IF v_supporter_count >= 100 THEN
    v_supporters_score := 15;
  ELSIF v_supporter_count >= 50 THEN
    v_supporters_score := 12;
  ELSIF v_supporter_count >= 25 THEN
    v_supporters_score := 9;
  ELSIF v_supporter_count >= 10 THEN
    v_supporters_score := 6;
  ELSIF v_supporter_count > 0 THEN
    v_supporters_score := 3;
  END IF;
  
  -- COLLAB TYPE MATCH (15 pts max)
  -- Artists with tracks/videos show content creation capability
  IF v_entity.collab_types IS NOT NULL THEN
    IF 'ugc_content' = ANY(v_entity.collab_types) AND EXISTS(SELECT 1 FROM artist_video_posts WHERE artist_id = _artist_id) THEN
      v_collab_type_score := v_collab_type_score + 5;
    END IF;
    IF 'live_event' = ANY(v_entity.collab_types) AND EXISTS(SELECT 1 FROM artist_live_streams WHERE artist_id = _artist_id) THEN
      v_collab_type_score := v_collab_type_score + 5;
    END IF;
    IF 'festival_slot' = ANY(v_entity.collab_types) AND EXISTS(SELECT 1 FROM tracks WHERE artist_id = _artist_id) THEN
      v_collab_type_score := v_collab_type_score + 5;
    END IF;
    v_collab_type_score := LEAST(v_collab_type_score, 15);
  END IF;
  
  -- Calculate total
  v_total_score := v_genre_score + v_location_score + v_xp_score + v_supporters_score + v_collab_type_score;
  
  RETURN jsonb_build_object(
    'totalScore', v_total_score,
    'genreScore', v_genre_score,
    'locationScore', v_location_score,
    'xpScore', v_xp_score,
    'supportersScore', v_supporters_score,
    'collabTypeScore', v_collab_type_score,
    'artistId', _artist_id,
    'entityId', _collab_entity_id
  );
END;
$$;

-- =====================================================
-- MATCHMAKING RPC: Get Top Artists for Entity
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_top_artists_for_entity(
  _collab_entity_id UUID,
  _limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  artist_id UUID,
  artist_name TEXT,
  avatar_url TEXT,
  genre TEXT,
  city TEXT,
  country TEXT,
  total_score INTEGER,
  genre_score INTEGER,
  location_score INTEGER,
  xp_score INTEGER,
  supporters_score INTEGER,
  collab_type_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH artist_scores AS (
    SELECT 
      ap.id AS artist_id,
      ap.artist_name,
      ap.avatar_url,
      ap.genre,
      ap.city,
      ap.country,
      calculate_artist_match_score(ap.id, _collab_entity_id) AS score_data
    FROM artist_profiles ap
    WHERE ap.status = 'approved'
  )
  SELECT 
    artist_scores.artist_id,
    artist_scores.artist_name,
    artist_scores.avatar_url,
    artist_scores.genre,
    artist_scores.city,
    artist_scores.country,
    (artist_scores.score_data->>'totalScore')::INTEGER AS total_score,
    (artist_scores.score_data->>'genreScore')::INTEGER AS genre_score,
    (artist_scores.score_data->>'locationScore')::INTEGER AS location_score,
    (artist_scores.score_data->>'xpScore')::INTEGER AS xp_score,
    (artist_scores.score_data->>'supportersScore')::INTEGER AS supporters_score,
    (artist_scores.score_data->>'collabTypeScore')::INTEGER AS collab_type_score
  FROM artist_scores
  ORDER BY (artist_scores.score_data->>'totalScore')::INTEGER DESC
  LIMIT _limit;
END;
$$;

-- =====================================================
-- MATCHMAKING RPC: Get Top Partners for Artist
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_top_partners_for_artist(
  _artist_id UUID,
  _limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entity_id UUID,
  entity_name TEXT,
  entity_type TEXT,
  logo_url TEXT,
  location TEXT,
  total_score INTEGER,
  genre_score INTEGER,
  location_score INTEGER,
  xp_score INTEGER,
  supporters_score INTEGER,
  collab_type_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH entity_scores AS (
    SELECT 
      ce.id AS entity_id,
      ce.name AS entity_name,
      ce.type AS entity_type,
      ce.logo_url,
      ce.location,
      calculate_artist_match_score(_artist_id, ce.id) AS score_data
    FROM collab_entities ce
    WHERE ce.is_active = true
  )
  SELECT 
    entity_scores.entity_id,
    entity_scores.entity_name,
    entity_scores.entity_type,
    entity_scores.logo_url,
    entity_scores.location,
    (entity_scores.score_data->>'totalScore')::INTEGER AS total_score,
    (entity_scores.score_data->>'genreScore')::INTEGER AS genre_score,
    (entity_scores.score_data->>'locationScore')::INTEGER AS location_score,
    (entity_scores.score_data->>'xpScore')::INTEGER AS xp_score,
    (entity_scores.score_data->>'supportersScore')::INTEGER AS supporters_score,
    (entity_scores.score_data->>'collabTypeScore')::INTEGER AS collab_type_score
  FROM entity_scores
  ORDER BY (entity_scores.score_data->>'totalScore')::INTEGER DESC
  LIMIT _limit;
END;
$$;

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================

CREATE TRIGGER update_collab_entities_updated_at
BEFORE UPDATE ON public.collab_entities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collab_opportunities_updated_at
BEFORE UPDATE ON public.collab_opportunities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_presskits_updated_at
BEFORE UPDATE ON public.artist_presskits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collab_applications_updated_at
BEFORE UPDATE ON public.collab_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_collab_entities_type ON public.collab_entities(type);
CREATE INDEX idx_collab_entities_slug ON public.collab_entities(slug);
CREATE INDEX idx_collab_entities_active ON public.collab_entities(is_active);

CREATE INDEX idx_collab_entity_admins_user ON public.collab_entity_admins(user_id);
CREATE INDEX idx_collab_entity_admins_entity ON public.collab_entity_admins(collab_entity_id);

CREATE INDEX idx_collab_opportunities_entity ON public.collab_opportunities(collab_entity_id);
CREATE INDEX idx_collab_opportunities_active ON public.collab_opportunities(is_active);

CREATE INDEX idx_artist_presskits_artist ON public.artist_presskits(artist_id);
CREATE INDEX idx_artist_presskits_slug ON public.artist_presskits(artist_id, slug);

CREATE INDEX idx_artist_presskit_media_presskit ON public.artist_presskit_media(presskit_id);

CREATE INDEX idx_collab_applications_opportunity ON public.collab_applications(opportunity_id);
CREATE INDEX idx_collab_applications_artist ON public.collab_applications(artist_id);
CREATE INDEX idx_collab_applications_status ON public.collab_applications(status);

CREATE INDEX idx_collab_interest_entity ON public.collab_interest(collab_entity_id);
CREATE INDEX idx_collab_interest_artist ON public.collab_interest(artist_id);
