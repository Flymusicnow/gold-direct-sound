-- =============================================
-- PHASE 2: SUPPORTER PASS V2 (Payments)
-- =============================================

-- Supporter subscriptions table
CREATE TABLE supporter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'gold')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  total_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fan_user_id, artist_id)
);

ALTER TABLE supporter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON supporter_subscriptions FOR SELECT
  USING (auth.uid() = fan_user_id);

CREATE POLICY "Artists can view their supporters"
  ON supporter_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artist_profiles
    WHERE id = supporter_subscriptions.artist_id AND user_id = auth.uid()
  ));

-- Artist payouts table
CREATE TABLE artist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_due NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  last_payout_at TIMESTAMPTZ,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_user_id)
);

ALTER TABLE artist_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view own payouts"
  ON artist_payouts FOR SELECT
  USING (auth.uid() = artist_user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_supporter_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER supporter_subscriptions_updated_at
BEFORE UPDATE ON supporter_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_supporter_subscription_timestamp();