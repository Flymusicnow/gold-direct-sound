
-- Smart Link Pages table - Artist landing pages
CREATE TABLE public.smart_link_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  suspension_reason TEXT,
  suspension_type TEXT CHECK (suspension_type IN ('permanent', 'temporary', 'appeal')),
  suspended_until TIMESTAMPTZ,
  suspended_by UUID REFERENCES public.profiles(id),
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Smart Link External Links table - External platform links
CREATE TABLE public.smart_link_external_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  smart_link_page_id UUID NOT NULL REFERENCES public.smart_link_pages(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed', 'verified')),
  flag_reason TEXT,
  flagged_by UUID,
  flagged_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES public.profiles(id),
  removal_reason TEXT,
  is_permanently_blocked BOOLEAN DEFAULT false,
  click_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Smart Link Clicks table - Click tracking per link
CREATE TABLE public.smart_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_link_id UUID NOT NULL REFERENCES public.smart_link_external_links(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL,
  user_id UUID,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Smart Link Page Visits table - Page visit tracking with retention metrics
CREATE TABLE public.smart_link_page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  smart_link_page_id UUID NOT NULL REFERENCES public.smart_link_pages(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL,
  user_id UUID,
  played_on_flymusic BOOLEAN NOT NULL DEFAULT false,
  clicked_external BOOLEAN NOT NULL DEFAULT false,
  external_platform TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Smart Link Audit Log table - All changes for audit trail
CREATE TABLE public.smart_link_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('page', 'link')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'flag', 'verify', 'remove', 'suspend', 'unsuspend', 'approve')),
  performed_by UUID NOT NULL,
  performed_by_role TEXT NOT NULL CHECK (performed_by_role IN ('artist', 'admin')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_smart_link_pages_artist_id ON public.smart_link_pages(artist_id);
CREATE INDEX idx_smart_link_pages_slug ON public.smart_link_pages(slug);
CREATE INDEX idx_smart_link_pages_status ON public.smart_link_pages(status);
CREATE INDEX idx_smart_link_external_links_page_id ON public.smart_link_external_links(smart_link_page_id);
CREATE INDEX idx_smart_link_external_links_status ON public.smart_link_external_links(status);
CREATE INDEX idx_smart_link_external_links_artist_id ON public.smart_link_external_links(artist_id);
CREATE INDEX idx_smart_link_clicks_link_id ON public.smart_link_clicks(external_link_id);
CREATE INDEX idx_smart_link_clicks_created_at ON public.smart_link_clicks(created_at);
CREATE INDEX idx_smart_link_page_visits_page_id ON public.smart_link_page_visits(smart_link_page_id);
CREATE INDEX idx_smart_link_page_visits_created_at ON public.smart_link_page_visits(created_at);
CREATE INDEX idx_smart_link_audit_log_entity ON public.smart_link_audit_log(entity_type, entity_id);

-- Enable RLS on all tables
ALTER TABLE public.smart_link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_external_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smart_link_pages
CREATE POLICY "Admins can view all smart link pages"
  ON public.smart_link_pages FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all smart link pages"
  ON public.smart_link_pages FOR ALL
  USING (is_admin());

CREATE POLICY "Artists can view own smart link page"
  ON public.smart_link_pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = smart_link_pages.artist_id
    AND artist_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Artists can manage own smart link page"
  ON public.smart_link_pages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = smart_link_pages.artist_id
    AND artist_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Public can view active smart link pages"
  ON public.smart_link_pages FOR SELECT
  USING (status = 'active');

-- RLS Policies for smart_link_external_links
CREATE POLICY "Admins can view all external links"
  ON public.smart_link_external_links FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all external links"
  ON public.smart_link_external_links FOR ALL
  USING (is_admin());

CREATE POLICY "Artists can view own external links"
  ON public.smart_link_external_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = smart_link_external_links.artist_id
    AND artist_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Artists can manage own external links"
  ON public.smart_link_external_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = smart_link_external_links.artist_id
    AND artist_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Public can view active non-removed external links"
  ON public.smart_link_external_links FOR SELECT
  USING (status IN ('active', 'verified'));

-- RLS Policies for smart_link_clicks
CREATE POLICY "Admins can view all clicks"
  ON public.smart_link_clicks FOR SELECT
  USING (is_admin());

CREATE POLICY "Artists can view own link clicks"
  ON public.smart_link_clicks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = smart_link_clicks.artist_id
    AND artist_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert clicks"
  ON public.smart_link_clicks FOR INSERT
  WITH CHECK (true);

-- RLS Policies for smart_link_page_visits
CREATE POLICY "Admins can view all page visits"
  ON public.smart_link_page_visits FOR SELECT
  USING (is_admin());

CREATE POLICY "Artists can view own page visits"
  ON public.smart_link_page_visits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = smart_link_page_visits.artist_id
    AND artist_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert page visits"
  ON public.smart_link_page_visits FOR INSERT
  WITH CHECK (true);

-- RLS Policies for smart_link_audit_log
CREATE POLICY "Admins can view all audit logs"
  ON public.smart_link_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert audit logs"
  ON public.smart_link_audit_log FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Artists can insert own audit logs"
  ON public.smart_link_audit_log FOR INSERT
  WITH CHECK (auth.uid() = performed_by AND performed_by_role = 'artist');

-- Create trigger for updated_at on smart_link_pages
CREATE TRIGGER update_smart_link_pages_updated_at
  BEFORE UPDATE ON public.smart_link_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on smart_link_external_links
CREATE TRIGGER update_smart_link_external_links_updated_at
  BEFORE UPDATE ON public.smart_link_external_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment click count
CREATE OR REPLACE FUNCTION public.increment_smart_link_click(_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE smart_link_external_links
  SET click_count = click_count + 1
  WHERE id = _link_id;
END;
$$;
