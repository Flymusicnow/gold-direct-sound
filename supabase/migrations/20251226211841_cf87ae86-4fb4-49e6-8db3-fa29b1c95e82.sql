-- Create a security definer function to check brand application status
-- This bypasses RLS so unauthenticated users can check their application status
CREATE OR REPLACE FUNCTION public.check_brand_application_status(_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status 
  FROM brand_applications 
  WHERE email = _email 
  ORDER BY created_at DESC 
  LIMIT 1
$$;