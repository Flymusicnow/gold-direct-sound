-- ============================================================
-- PHASE 1: PREMIUM ECOSYSTEM DATABASE FOUNDATION
-- ============================================================

-- 1. Create premium_plans table
CREATE TABLE public.premium_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('artist', 'fan', 'brand')),
  plan_key TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  price_monthly NUMERIC DEFAULT 0,
  price_yearly NUMERIC,
  currency TEXT DEFAULT 'SEK',
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_key TEXT NOT NULL REFERENCES public.premium_plans(plan_key),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_premium_plans_user_type ON public.premium_plans(user_type);

-- 3. Enhance feature_flags with tier columns
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS enabled_for_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enabled_for_pro BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enabled_for_elite BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enabled_for_brands BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_subscription BOOLEAN DEFAULT false;

-- 4. Enable RLS
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for premium_plans (publicly readable)
CREATE POLICY "Anyone can view active plans"
ON public.premium_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON public.premium_plans FOR ALL
USING (is_admin());

-- 6. RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions FOR ALL
USING (is_admin());

-- 7. Trigger for updated_at
CREATE TRIGGER update_premium_plans_updated_at
BEFORE UPDATE ON public.premium_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Seed Artist Plans
INSERT INTO public.premium_plans (user_type, plan_key, plan_name, price_monthly, price_yearly, description, features, sort_order) VALUES
('artist', 'artist_free', 'Artist Free', 0, NULL, 'Essential tools to get started on FlyMusic', 
 '["Standard PressKit", "3 Opportunities per month", "Basic Analytics", "Upload Tracks & Videos", "Spotlight Entry"]'::jsonb, 1),
('artist', 'artist_pro', 'Artist Pro', 99, 990, 'Professional tools for serious growth',
 '["PressKit v2 with multiple versions", "Unlimited Opportunities", "Full Analytics & Insights", "AI Bio Generator", "Priority in Match Engine", "Unlimited Media Uploads", "Supporter Analytics"]'::jsonb, 2),
('artist', 'artist_elite', 'Artist Elite', 249, 2490, 'Maximum visibility and advanced tools',
 '["Everything in Pro", "Brand Deal Accelerator", "Presskit Viewer Analytics", "Artist Website Builder", "AI Pitch Generator", "Collab Negotiation Tools", "Featured Placement"]'::jsonb, 3);

-- 9. Seed Fan Plans
INSERT INTO public.premium_plans (user_type, plan_key, plan_name, price_monthly, price_yearly, description, features, sort_order) VALUES
('fan', 'fan_free', 'Fan Free', 0, NULL, 'Discover and support amazing artists',
 '["Follow Artists", "XP System", "Spotlight Voting", "Personalized Feed", "Create Stacks"]'::jsonb, 1),
('fan', 'fan_supporter', 'Supporter Pass', 49, 490, 'The ultimate fan experience',
 '["2x XP Boost on all actions", "Exclusive Live Streams", "Early Access to Content", "Supporter Badge", "Priority Support", "Ad-free Experience"]'::jsonb, 2);

-- 10. Seed Brand Plans
INSERT INTO public.premium_plans (user_type, plan_key, plan_name, price_monthly, price_yearly, description, features, sort_order) VALUES
('brand', 'brand_lite', 'Brand Lite', 0, NULL, 'Explore the FlyMusic ecosystem',
 '["Brand Portal Access", "3 Opportunities per month", "Basic Artist Search", "Match Engine Basic", "View Artist Presskits"]'::jsonb, 1),
('brand', 'brand_pro', 'Brand Pro', 999, 9990, 'Full access for active brand partnerships',
 '["Unlimited Opportunities", "Full Artist Search & Filters", "Match Engine Pro", "Artist Insights Dashboard", "Team Accounts (up to 5)", "Priority Placement", "Application Management"]'::jsonb, 2),
('brand', 'brand_enterprise', 'Enterprise', NULL, NULL, 'Custom enterprise solution for large organizations',
 '["Everything Unlimited", "API Access", "Festival Lineup Builder", "On-site Integration Tools", "Dedicated Success Manager", "Custom Reporting", "White-label Options"]'::jsonb, 3);

-- 11. Create helper function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID, _user_type TEXT DEFAULT 'artist')
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_key TEXT;
BEGIN
  SELECT us.plan_key INTO v_plan_key
  FROM user_subscriptions us
  WHERE us.user_id = _user_id
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Return free plan if no subscription found
  IF v_plan_key IS NULL THEN
    RETURN _user_type || '_free';
  END IF;
  
  RETURN v_plan_key;
END;
$$;

-- 12. Create function to check feature access
CREATE OR REPLACE FUNCTION public.check_feature_access(_user_id UUID, _feature_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_key TEXT;
  v_flag RECORD;
  v_is_pro BOOLEAN;
  v_is_elite BOOLEAN;
BEGIN
  -- Get user's current plan
  SELECT us.plan_key INTO v_plan_key
  FROM user_subscriptions us
  WHERE us.user_id = _user_id
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Get feature flag
  SELECT * INTO v_flag
  FROM feature_flags
  WHERE flag_key = _feature_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'feature_not_configured');
  END IF;
  
  -- Check if feature requires subscription
  IF NOT v_flag.requires_subscription THEN
    RETURN jsonb_build_object('allowed', v_flag.is_enabled, 'reason', 'feature_flag');
  END IF;
  
  -- Determine plan tier
  v_is_pro := v_plan_key LIKE '%_pro' OR v_plan_key LIKE '%_elite' OR v_plan_key LIKE '%_supporter';
  v_is_elite := v_plan_key LIKE '%_elite' OR v_plan_key = 'brand_enterprise';
  
  -- Check tier access
  IF v_is_elite AND v_flag.enabled_for_elite THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'elite_access');
  ELSIF v_is_pro AND v_flag.enabled_for_pro THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'pro_access');
  ELSIF v_flag.enabled_for_free THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'free_access');
  ELSE
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'upgrade_required',
      'required_tier', CASE 
        WHEN v_flag.enabled_for_pro THEN 'pro'
        WHEN v_flag.enabled_for_elite THEN 'elite'
        ELSE 'unknown'
      END
    );
  END IF;
END;
$$;