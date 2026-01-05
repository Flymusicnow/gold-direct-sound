-- Create spotlight templates table first (referenced by spotlight_media)
CREATE TABLE public.spotlight_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('release', 'tour', 'merch', 'announcement', 'custom')),
  description TEXT,
  thumbnail_url TEXT,
  layout_config JSONB NOT NULL DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotlight_templates ENABLE ROW LEVEL SECURITY;

-- Public read for templates
CREATE POLICY "Anyone can view spotlight templates"
ON public.spotlight_templates FOR SELECT
USING (true);

-- Seed default templates
INSERT INTO public.spotlight_templates (name, category, description, layout_config, sort_order) VALUES
  ('New Release', 'release', 'Announce a new track or album', '{"overlay":"bottom","showTitle":true,"showDate":true}', 1),
  ('Tour Dates', 'tour', 'Promote upcoming live shows', '{"overlay":"full","showVenue":true,"showTicketLink":true}', 2),
  ('Merch Drop', 'merch', 'Feature new merchandise', '{"overlay":"bottom","showPrice":true,"showShopLink":true}', 3),
  ('Announcement', 'announcement', 'General artist announcement', '{"overlay":"center","showMessage":true}', 4),
  ('Minimal', 'custom', 'Clean, simple spotlight', '{"overlay":"none"}', 5);

-- Create artist spotlight media table
CREATE TABLE public.artist_spotlight_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Auto-play timing (3-7 seconds)
  display_duration_seconds INTEGER DEFAULT 5 CHECK (display_duration_seconds >= 3 AND display_duration_seconds <= 7),
  
  -- Link support
  link_type TEXT DEFAULT 'none' CHECK (link_type IN ('none', 'internal', 'external')),
  link_url TEXT,
  link_platform TEXT,
  link_label TEXT,
  
  -- Template reference
  template_id UUID REFERENCES public.spotlight_templates(id),
  template_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_spotlight_artist ON public.artist_spotlight_media(artist_id);
CREATE INDEX idx_spotlight_active ON public.artist_spotlight_media(artist_id, start_date, end_date);
CREATE INDEX idx_spotlight_schedule ON public.artist_spotlight_media(start_date, end_date, is_active);

-- Enable RLS
ALTER TABLE public.artist_spotlight_media ENABLE ROW LEVEL SECURITY;

-- Public can view active spotlight media
CREATE POLICY "Public can view active spotlight media"
ON public.artist_spotlight_media FOR SELECT
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now()) 
  AND (end_date IS NULL OR end_date >= now())
);

-- Artists can manage their own spotlight
CREATE POLICY "Artists can manage own spotlight media"
ON public.artist_spotlight_media FOR ALL
USING (
  artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
);

-- Create spotlight views table for analytics
CREATE TABLE public.spotlight_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotlight_media_id UUID NOT NULL REFERENCES public.artist_spotlight_media(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  view_duration_ms INTEGER DEFAULT 0,
  clicked_link BOOLEAN DEFAULT false,
  link_type TEXT,
  source TEXT,
  referrer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_spotlight_views_media ON public.spotlight_views(spotlight_media_id);
CREATE INDEX idx_spotlight_views_artist ON public.spotlight_views(artist_id);
CREATE INDEX idx_spotlight_views_date ON public.spotlight_views(created_at);

-- Enable RLS
ALTER TABLE public.spotlight_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views
CREATE POLICY "Anyone can record spotlight views"
ON public.spotlight_views FOR INSERT
WITH CHECK (true);

-- Artists can view their own analytics
CREATE POLICY "Artists can view their spotlight analytics"
ON public.spotlight_views FOR SELECT
USING (
  artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
);

-- Create inbound tracking table for deep links
CREATE TABLE public.inbound_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  campaign_name TEXT,
  landing_type TEXT NOT NULL,
  landing_id UUID,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  converted_to_follow BOOLEAN DEFAULT false,
  converted_to_support BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inbound_artist ON public.inbound_tracking(artist_id);
CREATE INDEX idx_inbound_source ON public.inbound_tracking(source_platform);
CREATE INDEX idx_inbound_date ON public.inbound_tracking(created_at);

-- Enable RLS
ALTER TABLE public.inbound_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone can insert tracking
CREATE POLICY "Anyone can record inbound tracking"
ON public.inbound_tracking FOR INSERT
WITH CHECK (true);

-- Artists can view their inbound analytics
CREATE POLICY "Artists can view their inbound analytics"
ON public.inbound_tracking FOR SELECT
USING (
  artist_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
);

-- Create storage bucket for spotlight media
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-spotlight', 'artist-spotlight', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view spotlight media"
ON storage.objects FOR SELECT
USING (bucket_id = 'artist-spotlight');

CREATE POLICY "Artists can upload spotlight media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artist-spotlight'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Artists can update own spotlight media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'artist-spotlight'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can delete own spotlight media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'artist-spotlight'
  AND auth.uid()::text = (storage.foldername(name))[1]
);