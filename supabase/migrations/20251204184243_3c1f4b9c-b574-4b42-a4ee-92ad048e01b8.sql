-- Create feature_flags table for controlling feature rollout
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key TEXT NOT NULL UNIQUE,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags (needed for frontend checks)
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only admins can manage feature flags
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial feature flags (all disabled by default)
INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled) VALUES
  ('TRUST_LAYER_ENABLED', 'Trust Layer', 'Transparency pages and "Why You See This" widgets', false),
  ('SOCIAL_RITUALS_ENABLED', 'Social Rituals', 'Daily/weekly missions and FlyWrapped', false),
  ('REACH_ECONOMY_ENABLED', 'Reach Economy 2.0', 'Boost tokens, Crowd Push, weighted ranking', false),
  ('LIVE_OS_V2_ENABLED', 'LiveCulture OS', 'Enhanced live with rewards, gifting, co-hosting', false);