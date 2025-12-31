-- Create universal invite code validation function for both artists and fans
-- This replaces the incorrect validate_fan_invite_code that searched the wrong table

CREATE OR REPLACE FUNCTION public.validate_invite_code_universal(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_record RECORD;
  v_normalized_code TEXT;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Normalize code: uppercase, remove spaces and hyphens
  v_normalized_code := UPPER(REPLACE(REPLACE(TRIM(_code), '-', ''), ' ', ''));
  
  -- Find valid invite in beta_invites (status = 'sent' means ready to redeem)
  SELECT * INTO v_invite_record
  FROM beta_invites
  WHERE UPPER(REPLACE(REPLACE(code, '-', ''), ' ', '')) = v_normalized_code
    AND status = 'sent';
  
  IF NOT FOUND THEN
    -- Check if code exists but has different status
    SELECT * INTO v_invite_record
    FROM beta_invites
    WHERE UPPER(REPLACE(REPLACE(code, '-', ''), ' ', '')) = v_normalized_code;
    
    IF FOUND THEN
      IF v_invite_record.status = 'redeemed' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This code has already been used');
      ELSIF v_invite_record.status = 'pending' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This invite has not been sent yet');
      ELSE
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid invite code status');
      END IF;
    END IF;
    
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired invite code');
  END IF;
  
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Create invite session for account creation flow
  INSERT INTO fan_invite_sessions (token, email, expires_at)
  VALUES (v_token, v_invite_record.email, v_expires_at);
  
  -- Return success with all needed data
  RETURN jsonb_build_object(
    'valid', true,
    'token', v_token,
    'expires_at', v_expires_at,
    'role', v_invite_record.role,
    'email', v_invite_record.email,
    'invite_id', v_invite_record.id,
    'badge_name', CASE v_invite_record.role 
      WHEN 'artist' THEN 'Early Creator' 
      WHEN 'fan' THEN 'Early Supporter'
      ELSE 'Beta Tester'
    END
  );
END;
$$;