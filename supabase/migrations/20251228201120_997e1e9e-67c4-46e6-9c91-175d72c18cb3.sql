-- Create app_settings table for app_mode feature flag
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default PRIVATE_BETA mode
INSERT INTO public.app_settings (key, value) VALUES ('app_mode', 'PRIVATE_BETA');

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read app_mode (needed for frontend gating)
CREATE POLICY "Anyone can read app_settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only admins can update app_settings
CREATE POLICY "Admins can update app_settings"
ON public.app_settings
FOR UPDATE
USING (is_admin());

-- Create RPC function for safe app_mode reading
CREATE OR REPLACE FUNCTION public.get_app_mode()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT value FROM public.app_settings WHERE key = 'app_mode';
$$;

-- Create RPC function for admin to update app_mode
CREATE OR REPLACE FUNCTION public.set_app_mode(_mode TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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