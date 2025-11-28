-- Create artist onboarding progress table
CREATE TABLE artist_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  has_uploaded_track BOOLEAN DEFAULT FALSE,
  has_uploaded_video BOOLEAN DEFAULT FALSE,
  has_shared_profile BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE artist_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding progress
CREATE POLICY "Users can view own onboarding progress"
  ON artist_onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON artist_onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON artist_onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create beta access codes table
CREATE TABLE beta_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE beta_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for beta codes (anyone can read active codes for validation)
CREATE POLICY "Anyone can view active beta codes"
  ON beta_access_codes FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage beta codes"
  ON beta_access_codes FOR ALL
  USING (is_admin());

-- Create artist beta access table
CREATE TABLE artist_beta_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES beta_access_codes(id),
  tier TEXT DEFAULT 'early_access',
  badge_name TEXT DEFAULT 'Early Access Tester',
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE artist_beta_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for beta access
CREATE POLICY "Users can view own beta access"
  ON artist_beta_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all beta access for public badges"
  ON artist_beta_access FOR SELECT
  USING (true);

CREATE POLICY "System can insert beta access"
  ON artist_beta_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed default beta codes
INSERT INTO beta_access_codes (code, description, max_uses, is_active)
VALUES 
  ('FLYMUSIC2024', 'General early access code', 100, TRUE),
  ('GOLD100', 'First 100 artists', 100, TRUE),
  ('BETATESTER', 'Beta tester code', 50, TRUE);

-- Create trigger to update onboarding updated_at
CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON artist_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate and redeem beta code
CREATE OR REPLACE FUNCTION redeem_beta_code(_code TEXT, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
  existing_access RECORD;
BEGIN
  -- Check if user already has beta access
  SELECT * INTO existing_access
  FROM artist_beta_access
  WHERE user_id = _user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have beta access');
  END IF;
  
  -- Find and validate the code
  SELECT * INTO code_record
  FROM beta_access_codes
  WHERE code = _code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now())
    AND current_uses < max_uses;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;
  
  -- Insert beta access
  INSERT INTO artist_beta_access (user_id, code_id, tier, badge_name)
  VALUES (_user_id, code_record.id, 'early_access', 'Early Access Tester');
  
  -- Increment code usage
  UPDATE beta_access_codes
  SET current_uses = current_uses + 1
  WHERE id = code_record.id;
  
  RETURN jsonb_build_object('success', true, 'badge', 'Early Access Tester');
END;
$$;