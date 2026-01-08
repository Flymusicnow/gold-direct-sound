-- Create enum types for pricing status and scope
DO $$ BEGIN
  CREATE TYPE pricing_status AS ENUM ('beta_free', 'discounted', 'standard');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_scope AS ENUM ('platform_fees', 'subscriptions', 'features', 'all');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create artist_pricing_overrides table
CREATE TABLE IF NOT EXISTS public.artist_pricing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  
  -- Discount Configuration
  status pricing_status NOT NULL DEFAULT 'standard',
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  scope discount_scope NOT NULL DEFAULT 'all',
  
  -- Time Controls
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = open-ended
  
  -- Admin Tracking
  reason TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one active override per artist
  UNIQUE(artist_id)
);

-- Create pricing_override_audit_log table
CREATE TABLE IF NOT EXISTS public.pricing_override_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id UUID REFERENCES public.artist_pricing_overrides(id) ON DELETE SET NULL,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  
  -- What changed
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  
  -- Who changed it
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.artist_pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_override_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_pricing_overrides (admin only)
CREATE POLICY "Admins can manage pricing overrides"
  ON public.artist_pricing_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for pricing_override_audit_log (admin read only)
CREATE POLICY "Admins can view audit log"
  ON public.pricing_override_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert audit log"
  ON public.pricing_override_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create function to check artist pricing status
CREATE OR REPLACE FUNCTION public.check_artist_pricing_status(p_artist_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_override
  FROM artist_pricing_overrides
  WHERE artist_id = p_artist_id
    AND status != 'standard'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now());
  
  IF FOUND THEN
    v_result := jsonb_build_object(
      'has_override', true,
      'status', v_override.status::text,
      'discount_percent', COALESCE(v_override.discount_percent, 
        CASE WHEN v_override.status = 'beta_free' THEN 100 ELSE 0 END),
      'scope', v_override.scope::text,
      'expires_at', v_override.expires_at
    );
  ELSE
    v_result := jsonb_build_object(
      'has_override', false,
      'status', 'standard',
      'discount_percent', 0,
      'scope', null,
      'expires_at', null
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create function for artists to get their own pricing status
CREATE OR REPLACE FUNCTION public.get_my_pricing_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id UUID;
  v_result JSONB;
BEGIN
  -- Get the artist_id for the current user
  SELECT id INTO v_artist_id
  FROM artist_profiles
  WHERE user_id = auth.uid();
  
  IF v_artist_id IS NULL THEN
    RETURN jsonb_build_object(
      'has_override', false,
      'status', 'standard',
      'discount_percent', 0,
      'scope', null,
      'expires_at', null
    );
  END IF;
  
  RETURN check_artist_pricing_status(v_artist_id);
END;
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_pricing_override_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artist_pricing_overrides_updated_at
  BEFORE UPDATE ON public.artist_pricing_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pricing_override_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_overrides_artist_id ON public.artist_pricing_overrides(artist_id);
CREATE INDEX IF NOT EXISTS idx_pricing_overrides_status ON public.artist_pricing_overrides(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_artist_id ON public.pricing_override_audit_log(artist_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON public.pricing_override_audit_log(changed_at DESC);