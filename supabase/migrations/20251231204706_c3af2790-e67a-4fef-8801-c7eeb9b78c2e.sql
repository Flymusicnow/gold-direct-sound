-- Fix the validate_invite_code_universal function by adding extensions to search_path
CREATE OR REPLACE FUNCTION public.validate_invite_code_universal(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _invite RECORD;
  _token TEXT;
  _expires_at TIMESTAMPTZ;
  _badge_name TEXT;
BEGIN
  -- Normalize the code: trim, uppercase, remove hyphens and spaces
  _code := UPPER(TRIM(REGEXP_REPLACE(_code, '[-\s]', '', 'g')));
  
  -- Look up the invite in beta_invites table
  SELECT * INTO _invite
  FROM public.beta_invites
  WHERE UPPER(TRIM(REGEXP_REPLACE(code, '[-\s]', '', 'g'))) = _code
  LIMIT 1;
  
  -- Check if invite exists
  IF _invite IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if already redeemed
  IF _invite.status = 'redeemed' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has already been used');
  END IF;
  
  -- Check if status is 'sent' (valid for redemption)
  IF _invite.status != 'sent' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code is not yet active');
  END IF;
  
  -- Determine badge name based on role
  _badge_name := CASE 
    WHEN _invite.role = 'artist' THEN 'Early Artist'
    WHEN _invite.role = 'fan' THEN 'Early Supporter'
    ELSE 'Beta Tester'
  END;
  
  -- Generate session token
  _token := encode(gen_random_bytes(32), 'hex');
  _expires_at := NOW() + INTERVAL '24 hours';
  
  -- Create fan_invite_session for the token
  INSERT INTO public.fan_invite_sessions (token, expires_at, email)
  VALUES (_token, _expires_at, _invite.email);
  
  RETURN jsonb_build_object(
    'valid', true,
    'token', _token,
    'expires_at', _expires_at,
    'badge_name', _badge_name,
    'role', _invite.role,
    'email', _invite.email,
    'invite_id', _invite.id
  );
END;
$$;

-- Create edge_function_logs table for storing function execution logs
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  step TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  details JSONB,
  execution_time_ms INTEGER,
  status_code INTEGER,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_edge_logs_correlation ON public.edge_function_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_edge_logs_function ON public.edge_function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_logs_created ON public.edge_function_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_logs_level ON public.edge_function_logs(level) WHERE level IN ('warn', 'error');

-- Enable RLS
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view edge function logs"
ON public.edge_function_logs FOR SELECT TO authenticated
USING (public.is_admin());

-- Allow insert for edge functions (they use service role)
CREATE POLICY "Allow insert for service role"
ON public.edge_function_logs FOR INSERT
WITH CHECK (true);

-- Enable realtime for live log streaming
ALTER PUBLICATION supabase_realtime ADD TABLE public.edge_function_logs;