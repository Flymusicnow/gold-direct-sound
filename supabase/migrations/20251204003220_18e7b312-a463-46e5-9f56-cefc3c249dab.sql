-- =====================================================
-- SUPPORTER PASS V2: Stripe Connect Foundation
-- =====================================================

-- 1. Create artist_stripe_accounts table
CREATE TABLE public.artist_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'onboarding', 'active', 'restricted')),
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id),
  UNIQUE(stripe_account_id)
);

-- Enable RLS
ALTER TABLE public.artist_stripe_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_stripe_accounts
CREATE POLICY "Artists can view own stripe account"
  ON public.artist_stripe_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artist_profiles ap 
    WHERE ap.id = artist_stripe_accounts.artist_id 
    AND ap.user_id = auth.uid()
  ));

CREATE POLICY "Artists can update own stripe account"
  ON public.artist_stripe_accounts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM artist_profiles ap 
    WHERE ap.id = artist_stripe_accounts.artist_id 
    AND ap.user_id = auth.uid()
  ));

CREATE POLICY "System can insert stripe accounts"
  ON public.artist_stripe_accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all stripe accounts"
  ON public.artist_stripe_accounts FOR SELECT
  USING (is_admin());

-- 2. Create supporter_tiers table
CREATE TABLE public.supporter_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT DEFAULT 'SEK',
  interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id, slug)
);

-- Enable RLS
ALTER TABLE public.supporter_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for supporter_tiers
CREATE POLICY "Anyone can view active tiers"
  ON public.supporter_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Artists can view own tiers"
  ON public.supporter_tiers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artist_profiles ap 
    WHERE ap.id = supporter_tiers.artist_id 
    AND ap.user_id = auth.uid()
  ));

CREATE POLICY "Artists can insert own tiers"
  ON public.supporter_tiers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM artist_profiles ap 
    WHERE ap.id = supporter_tiers.artist_id 
    AND ap.user_id = auth.uid()
  ));

CREATE POLICY "Artists can update own tiers"
  ON public.supporter_tiers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM artist_profiles ap 
    WHERE ap.id = supporter_tiers.artist_id 
    AND ap.user_id = auth.uid()
  ));

CREATE POLICY "Artists can delete own tiers"
  ON public.supporter_tiers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM artist_profiles ap 
    WHERE ap.id = supporter_tiers.artist_id 
    AND ap.user_id = auth.uid()
  ));

-- 3. Add tier_id to supporter_subscriptions
ALTER TABLE public.supporter_subscriptions
ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.supporter_tiers(id);

-- 4. Add type column to supporter_payments if not exists
ALTER TABLE public.supporter_payments
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'subscription' CHECK (type IN ('subscription', 'tip', 'one-time'));

-- 5. Create updated_at trigger for new tables
CREATE TRIGGER update_artist_stripe_accounts_updated_at
  BEFORE UPDATE ON public.artist_stripe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supporter_tiers_updated_at
  BEFORE UPDATE ON public.supporter_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();