-- 1. Alter beta_access_codes table to add new columns
ALTER TABLE beta_access_codes
  ADD COLUMN type text NOT NULL DEFAULT 'artist',
  ADD COLUMN badge_name text NOT NULL DEFAULT 'Early Access Tester',
  ADD COLUMN notes text,
  ADD COLUMN created_by uuid;

-- Add constraint for type values
ALTER TABLE beta_access_codes 
  ADD CONSTRAINT beta_codes_type_check CHECK (type IN ('artist', 'fan'));

-- 2. Alter artist_beta_access table to add code tracking
ALTER TABLE artist_beta_access
  ADD COLUMN code_used text;

-- 3. Update existing codes with badge names
UPDATE beta_access_codes SET badge_name = 'Pioneer Access' WHERE code = 'FLYMUSIC2024';
UPDATE beta_access_codes SET badge_name = 'Gold 100 Member' WHERE code = 'GOLD100';
UPDATE beta_access_codes SET badge_name = 'Beta Tester' WHERE code = 'BETATESTER';

-- 4. Update redeem_beta_code function to use new columns
CREATE OR REPLACE FUNCTION public.redeem_beta_code(_code text, _user_id uuid)
RETURNS jsonb
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
  
  -- Find and validate the code (artist type only for now)
  SELECT * INTO code_record
  FROM beta_access_codes
  WHERE code = _code
    AND type = 'artist'
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;
  
  -- Insert beta access with dynamic badge_name and code_used
  INSERT INTO artist_beta_access (user_id, code_id, tier, badge_name, code_used)
  VALUES (_user_id, code_record.id, 'early_access', code_record.badge_name, _code);
  
  -- Increment code usage
  UPDATE beta_access_codes
  SET current_uses = current_uses + 1
  WHERE id = code_record.id;
  
  RETURN jsonb_build_object('success', true, 'badge', code_record.badge_name);
END;
$$;