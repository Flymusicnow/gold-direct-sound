
-- Phase 2: Promo OS Database Schema

-- 2.1 Create promo_links table
CREATE TABLE public.promo_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('track', 'video', 'event', 'spotlight', 'profile')),
  content_id UUID,
  slug TEXT UNIQUE NOT NULL,
  campaign_name TEXT,
  utm_source TEXT,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Create promo_events table
CREATE TABLE public.promo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID NOT NULL REFERENCES promo_links(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'preview_50', 'follow_click', 'follow_success',
    'support_click', 'support_success', 'spotlight_vote', 'external_link'
  )),
  ip_hash TEXT,
  user_agent TEXT,
  utm_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add thumbnail_url to artist_video_posts if not exists
ALTER TABLE public.artist_video_posts 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Enable RLS
ALTER TABLE public.promo_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_events ENABLE ROW LEVEL SECURITY;

-- 2.3 RLS Policies for promo_links
CREATE POLICY "Artists can view own promo links"
ON public.promo_links FOR SELECT
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE artist_profiles.id = promo_links.artist_id 
  AND artist_profiles.user_id = auth.uid()
));

CREATE POLICY "Anyone can view active promo links by slug"
ON public.promo_links FOR SELECT
USING (is_active = true);

CREATE POLICY "Artists can create own promo links"
ON public.promo_links FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE artist_profiles.id = promo_links.artist_id 
  AND artist_profiles.user_id = auth.uid()
));

CREATE POLICY "Artists can update own promo links"
ON public.promo_links FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE artist_profiles.id = promo_links.artist_id 
  AND artist_profiles.user_id = auth.uid()
));

CREATE POLICY "Artists can delete own promo links"
ON public.promo_links FOR DELETE
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE artist_profiles.id = promo_links.artist_id 
  AND artist_profiles.user_id = auth.uid()
));

-- RLS Policies for promo_events
CREATE POLICY "Artists can view own promo events"
ON public.promo_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM artist_profiles 
  WHERE artist_profiles.id = promo_events.artist_id 
  AND artist_profiles.user_id = auth.uid()
));

CREATE POLICY "Anyone can insert promo events"
ON public.promo_events FOR INSERT
WITH CHECK (true);

-- Phase 1: Video System Hardening - Safe view increment with 30-second cooldown
CREATE OR REPLACE FUNCTION public.increment_video_view_safe(
  _video_id UUID,
  _user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_view_time TIMESTAMPTZ;
  should_count BOOLEAN := true;
BEGIN
  -- Check if user has viewed this video in last 30 seconds
  IF _user_id IS NOT NULL THEN
    SELECT MAX(created_at) INTO last_view_time
    FROM video_views
    WHERE video_id = _video_id 
    AND user_id = _user_id
    AND created_at > NOW() - INTERVAL '30 seconds';
    
    IF last_view_time IS NOT NULL THEN
      should_count := false;
    END IF;
  END IF;
  
  -- Only increment if cooldown passed
  IF should_count THEN
    -- Increment view count on artist_video_posts
    UPDATE artist_video_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = _video_id;
  END IF;
  
  RETURN should_count;
END;
$$;

-- Function to increment promo link click count
CREATE OR REPLACE FUNCTION public.increment_promo_click(_promo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE promo_links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = _promo_id;
END;
$$;

-- Function to get promo link stats for artist
CREATE OR REPLACE FUNCTION public.get_promo_link_stats(_artist_id UUID)
RETURNS TABLE (
  total_clicks BIGINT,
  total_views BIGINT,
  total_follows BIGINT,
  total_supporters BIGINT,
  total_spotlight_votes BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pl.click_count), 0)::BIGINT as total_clicks,
    COUNT(CASE WHEN pe.event_type = 'view' THEN 1 END)::BIGINT as total_views,
    COUNT(CASE WHEN pe.event_type = 'follow_success' THEN 1 END)::BIGINT as total_follows,
    COUNT(CASE WHEN pe.event_type = 'support_success' THEN 1 END)::BIGINT as total_supporters,
    COUNT(CASE WHEN pe.event_type = 'spotlight_vote' THEN 1 END)::BIGINT as total_spotlight_votes
  FROM promo_links pl
  LEFT JOIN promo_events pe ON pe.promo_id = pl.id
  WHERE pl.artist_id = _artist_id;
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promo_links_slug ON promo_links(slug);
CREATE INDEX IF NOT EXISTS idx_promo_links_artist ON promo_links(artist_id);
CREATE INDEX IF NOT EXISTS idx_promo_events_promo ON promo_events(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_events_artist ON promo_events(artist_id);
CREATE INDEX IF NOT EXISTS idx_video_views_cooldown ON video_views(video_id, user_id, created_at);
