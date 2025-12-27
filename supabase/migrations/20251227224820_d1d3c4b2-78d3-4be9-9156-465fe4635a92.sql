-- Create fan_invite_sessions table for invite-only fan access
CREATE TABLE public.fan_invite_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  code_id UUID REFERENCES public.beta_access_codes(id) ON DELETE SET NULL,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fan_invite_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own session by token (for validation)
CREATE POLICY "Anyone can validate invite sessions by token"
ON public.fan_invite_sessions
FOR SELECT
USING (true);

-- Policy: Only edge functions can insert (via service role)
CREATE POLICY "Service role can insert invite sessions"
ON public.fan_invite_sessions
FOR INSERT
WITH CHECK (true);

-- Policy: Only edge functions can update (mark as used)
CREATE POLICY "Service role can update invite sessions"
ON public.fan_invite_sessions
FOR UPDATE
USING (true);

-- Create index for fast token lookups
CREATE INDEX idx_fan_invite_sessions_token ON public.fan_invite_sessions(token);
CREATE INDEX idx_fan_invite_sessions_expires_at ON public.fan_invite_sessions(expires_at);

-- Create RPC function to validate fan invite code
CREATE OR REPLACE FUNCTION public.validate_fan_invite_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Find valid code
  SELECT * INTO v_code_record
  FROM beta_access_codes
  WHERE UPPER(code) = UPPER(_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired invite code');
  END IF;
  
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Create invite session
  INSERT INTO fan_invite_sessions (token, code_id, expires_at)
  VALUES (v_token, v_code_record.id, v_expires_at);
  
  -- Increment code usage
  UPDATE beta_access_codes
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = v_code_record.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'token', v_token,
    'expires_at', v_expires_at,
    'badge_name', v_code_record.badge_name
  );
END;
$$;