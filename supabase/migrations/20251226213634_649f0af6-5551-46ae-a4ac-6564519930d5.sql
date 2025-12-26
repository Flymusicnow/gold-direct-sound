CREATE OR REPLACE FUNCTION public.redeem_beta_code(_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Find and validate the code (any valid type: artist, fan, or brand)
  SELECT * INTO code_record
  FROM beta_access_codes
  WHERE code = _code
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