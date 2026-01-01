-- Drop existing function first
DROP FUNCTION IF EXISTS public.validate_invite_code_universal(text);

-- Recreate with updated logic for replaced status
CREATE FUNCTION public.validate_invite_code_universal(_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _invite RECORD;
  _token TEXT;
  _expires_at TIMESTAMPTZ;
  _session_id UUID;
BEGIN
  -- Normalize code: trim, uppercase, remove hyphens and spaces
  _code := UPPER(TRIM(REPLACE(REPLACE(_code, '-', ''), ' ', '')));
  
  -- Look up the invite in beta_invites table
  SELECT * INTO _invite
  FROM beta_invites
  WHERE UPPER(REPLACE(REPLACE(code, '-', ''), ' ', '')) = _code
  LIMIT 1;
  
  -- Not found
  IF _invite IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if replaced
  IF _invite.status = 'replaced' THEN
    RETURN json_build_object('valid', false, 'error', 'This code was replaced. Please check your email for a new invite code.');
  END IF;
  
  -- Check if already redeemed
  IF _invite.status = 'redeemed' OR _invite.redeemed_at IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'error', 'This invite code has already been used');
  END IF;
  
  -- Check if status is valid (should be 'sent')
  IF _invite.status NOT IN ('sent', 'created') THEN
    RETURN json_build_object('valid', false, 'error', 'This invite code is not yet active');
  END IF;
  
  -- Generate session token
  _token := encode(gen_random_bytes(32), 'hex');
  _expires_at := NOW() + INTERVAL '7 days';
  
  -- Create session in fan_invite_sessions table
  INSERT INTO fan_invite_sessions (token, code_id, email, expires_at)
  VALUES (_token, NULL, _invite.email, _expires_at)
  RETURNING id INTO _session_id;
  
  -- Return success with session info
  RETURN json_build_object(
    'valid', true,
    'token', _token,
    'expires_at', _expires_at,
    'badge_name', 'Early Adopter',
    'role', _invite.role,
    'email', _invite.email,
    'invite_id', _invite.id,
    'status', _invite.status
  );
END;
$$;