-- Migration 1: Enhance platform_updates table
ALTER TABLE platform_updates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'feature',
ADD COLUMN IF NOT EXISTS activation_log JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_platform_updates_category ON platform_updates(category);
CREATE INDEX IF NOT EXISTS idx_platform_updates_is_active ON platform_updates(is_active);

-- Migration 2: Create artist_verifications table
CREATE TABLE IF NOT EXISTS artist_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  verification_status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  rejection_reason TEXT,
  verification_type TEXT DEFAULT 'identity',
  documents_url TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE artist_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view own verification" ON artist_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Artists can insert own verification" ON artist_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artists can update own verification" ON artist_verifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications" ON artist_verifications
  FOR ALL USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_artist_verifications_status ON artist_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_artist_verifications_user_id ON artist_verifications(user_id);

-- Migration 3: Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);