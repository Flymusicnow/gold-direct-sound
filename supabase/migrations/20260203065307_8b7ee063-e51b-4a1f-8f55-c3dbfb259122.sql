-- ============================================================
-- FlyMusic V2 Canon Alignment — Complete Schema Migration
-- ============================================================

-- 1.1 Create platform_config Table
CREATE TABLE IF NOT EXISTS public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- RLS: Allow authenticated users to read config
CREATE POLICY "Anyone can read platform config"
ON public.platform_config
FOR SELECT
TO authenticated
USING (true);

-- RLS: Only super_admins can modify config
CREATE POLICY "Super admins can modify platform config"
ON public.platform_config
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Seed canonical defaults
INSERT INTO public.platform_config (key, value, description) VALUES
  ('mvp_mode', jsonb_build_object('enabled', true, 'grants', jsonb_build_array('artist_trial', 'fan_supporter')), 'MVP mode flag with restricted preview grants'),
  ('payments_enabled', 'false'::jsonb, 'Payment processing enabled (must be explicitly turned on)'),
  ('trial_policy', jsonb_build_object('enabled', true, 'allowed_lengths_days', jsonb_build_array(7, 14, 30), 'default_length_days', 14), 'Trial configuration')
ON CONFLICT (key) DO NOTHING;

-- 1.2 Create access_levels Table (Numeric Canon)
CREATE TABLE IF NOT EXISTS public.access_levels (
  code TEXT PRIMARY KEY,
  user_type TEXT NOT NULL,
  level INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE public.access_levels ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read access levels
CREATE POLICY "Anyone can read access levels"
ON public.access_levels
FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.access_levels (code, user_type, level) VALUES
  ('artist_free', 'artist', 0),
  ('artist_trial', 'artist', 10),
  ('artist_pro', 'artist', 20),
  ('artist_elite', 'artist', 30),
  ('fan_free', 'fan', 0),
  ('fan_trial', 'fan', 10),
  ('fan_supporter', 'fan', 20),
  ('fan_superfan', 'fan', 30)
ON CONFLICT (code) DO NOTHING;

-- 1.3 Create feature_permissions Table (Numeric Required Level)
CREATE TABLE IF NOT EXISTS public.feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  user_type TEXT NOT NULL,
  required_level INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  mvp_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read feature permissions
CREATE POLICY "Anyone can read feature permissions"
ON public.feature_permissions
FOR SELECT
TO authenticated
USING (true);

-- Seed canonical permissions
INSERT INTO public.feature_permissions 
  (feature_key, feature_name, user_type, required_level, sort_order, mvp_available)
VALUES
  ('basic_profile', 'Basic Profile', 'artist', 0, 10, true),
  ('limited_uploads', 'Limited Uploads', 'artist', 0, 20, true),
  ('full_analytics', 'Full Analytics', 'artist', 10, 30, true),
  ('community_tools', 'Community Tools', 'artist', 10, 40, true),
  ('advanced_analytics', 'Advanced Analytics', 'artist', 20, 50, true),
  ('fan_segmentation', 'Fan Segmentation', 'artist', 20, 60, true),
  ('campaign_builder', 'Campaign Builder', 'artist', 20, 70, true),
  ('follow_artists', 'Follow Artists', 'fan', 0, 10, true),
  ('basic_vote', 'Basic Voting', 'fan', 0, 20, true),
  ('highlight_votes', 'Highlight Votes', 'fan', 20, 30, true),
  ('vip_vote', 'VIP Votes', 'fan', 30, 40, true)
ON CONFLICT (feature_key) DO NOTHING;

-- 1.4 Create user_trials Table (Scope-Aware)
CREATE TABLE IF NOT EXISTS public.user_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trial_type TEXT NOT NULL DEFAULT 'platform',
  level_scope INTEGER NOT NULL DEFAULT 10,
  trial_length_days INTEGER NOT NULL DEFAULT 14,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  converted_to_plan TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, trial_type)
);

-- Enable RLS
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only read their own trials
CREATE POLICY "Users can read own trials"
ON public.user_trials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS: System can insert trials (via service role / function)
CREATE POLICY "System can manage trials"
ON public.user_trials
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Auto-calculate ends_at trigger
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ends_at := NEW.started_at + (NEW.trial_length_days || ' days')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS user_trials_set_end_date ON public.user_trials;
CREATE TRIGGER user_trials_set_end_date
BEFORE INSERT ON public.user_trials
FOR EACH ROW EXECUTE FUNCTION public.set_trial_end_date();

-- 1.5 Migrate premium_plans to öre + Fix Fan Supporter Price
ALTER TABLE public.premium_plans
  ADD COLUMN IF NOT EXISTS price_monthly_ore INTEGER,
  ADD COLUMN IF NOT EXISTS price_yearly_ore INTEGER;

UPDATE public.premium_plans
SET
  price_monthly_ore = COALESCE(price_monthly_ore, COALESCE(price_monthly, 0) * 100),
  price_yearly_ore = COALESCE(price_yearly_ore, COALESCE(price_yearly, 0) * 100);

-- Canon pricing: fan_supporter = 39 SEK = 3900 öre
UPDATE public.premium_plans
SET price_monthly_ore = 3900
WHERE plan_key = 'fan_supporter';

-- ============================================================
-- Phase 2: Database Functions (RPCs)
-- ============================================================

-- 2.1 Create get_trial_status RPC
CREATE OR REPLACE FUNCTION public.get_trial_status(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trial RECORD;
  _trial_policy JSONB;
  _days_left INT;
BEGIN
  SELECT value INTO _trial_policy FROM public.platform_config WHERE key = 'trial_policy';

  SELECT * INTO _trial
  FROM public.user_trials
  WHERE user_id = _user_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF _trial IS NULL THEN
    RETURN jsonb_build_object(
      'trial_enabled', COALESCE((_trial_policy->>'enabled')::BOOLEAN, true),
      'trial', jsonb_build_object(
        'active', false, 
        'type', NULL, 
        'level_scope', NULL,
        'started_at', NULL, 
        'ends_at', NULL, 
        'days_left', NULL, 
        'state', 'none'
      )
    );
  END IF;

  _days_left := GREATEST(0, EXTRACT(DAY FROM (_trial.ends_at - now()))::INT);

  RETURN jsonb_build_object(
    'trial_enabled', true,
    'trial', jsonb_build_object(
      'active', (_trial.ends_at > now() AND _trial.status = 'active'),
      'type', _trial.trial_type,
      'level_scope', _trial.level_scope,
      'started_at', _trial.started_at,
      'ends_at', _trial.ends_at,
      'days_left', _days_left,
      'state', CASE
        WHEN _trial.status = 'active' AND _trial.ends_at > now() THEN 'active'
        WHEN _trial.status = 'converted' THEN 'converted'
        ELSE 'expired'
      END
    )
  );
END;
$$;

-- 2.2 Create resolve_user_permissions RPC
CREATE OR REPLACE FUNCTION public.resolve_user_permissions(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mvp JSONB;
  _mvp_enabled BOOLEAN := true;
  _mvp_grants JSONB := '[]'::JSONB;
  _role TEXT := 'fan';
  _user_level INT := 0;
  _trial JSONB;
  _trial_active BOOLEAN := false;
  _trial_level INT := 0;
  _permissions JSONB := '{}'::JSONB;
  _perm RECORD;
BEGIN
  -- MVP mode config
  SELECT value INTO _mvp FROM public.platform_config WHERE key = 'mvp_mode';
  _mvp_enabled := COALESCE((_mvp->>'enabled')::BOOLEAN, true);
  _mvp_grants := COALESCE((_mvp->'grants'), '[]'::JSONB);

  -- Get user role
  SELECT COALESCE(p.role, 'fan') INTO _role FROM public.profiles p WHERE p.id = _user_id;

  -- Get trial status
  SELECT public.get_trial_status(_user_id) INTO _trial;
  _trial_active := COALESCE((_trial#>>'{trial,active}')::BOOLEAN, false);
  _trial_level := COALESCE((_trial#>>'{trial,level_scope}')::INT, 0);

  -- Baseline = free (0)
  _user_level := 0;

  -- Apply RESTRICTED MVP grants
  IF _mvp_enabled THEN
    IF _role = 'artist' AND (_mvp_grants ? 'artist_trial') THEN
      _user_level := GREATEST(_user_level, 10);
    END IF;
    IF _role = 'fan' AND (_mvp_grants ? 'fan_supporter') THEN
      _user_level := GREATEST(_user_level, 20);
    END IF;
  END IF;

  -- Apply trial scope
  IF _trial_active THEN
    _user_level := GREATEST(_user_level, _trial_level);
  END IF;

  -- Compute permissions numerically
  FOR _perm IN
    SELECT feature_key, required_level
    FROM public.feature_permissions
    WHERE is_active = true AND (user_type = _role OR user_type = 'all')
    ORDER BY sort_order
  LOOP
    _permissions := _permissions || jsonb_build_object(
      _perm.feature_key,
      (_user_level >= _perm.required_level)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'role', _role,
    'effective_level', _user_level,
    'trial', _trial->'trial',
    'mvp_mode', jsonb_build_object('enabled', _mvp_enabled, 'grants', _mvp_grants),
    'permissions', _permissions
  );
END;
$$;