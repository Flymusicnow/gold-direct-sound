-- Create fan_beta_access table for tracking permanent fan beta access
CREATE TABLE public.fan_beta_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code_id UUID REFERENCES beta_access_codes(id),
  badge_name TEXT DEFAULT 'Early Supporter',
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.fan_beta_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own access
CREATE POLICY "Users can read own fan beta access" ON public.fan_beta_access
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert their own access (after signup)
CREATE POLICY "Users can insert own fan beta access" ON public.fan_beta_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can manage all fan beta access
CREATE POLICY "Admins can manage fan beta access" ON public.fan_beta_access
  FOR ALL USING (is_admin());