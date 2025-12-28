-- Fix search_path for get_app_mode function
CREATE OR REPLACE FUNCTION public.get_app_mode()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'app_mode';
$$;

-- Fix search_path for set_app_mode function
CREATE OR REPLACE FUNCTION public.set_app_mode(_mode TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate mode
  IF _mode NOT IN ('PRIVATE_BETA', 'PUBLIC_AUTH', 'MAINTENANCE') THEN
    RAISE EXCEPTION 'Invalid app_mode: %', _mode;
  END IF;
  
  -- Check admin access
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can change app_mode';
  END IF;
  
  -- Update the mode
  UPDATE public.app_settings 
  SET value = _mode, updated_at = now(), updated_by = auth.uid()
  WHERE key = 'app_mode';
  
  RETURN TRUE;
END;
$$;