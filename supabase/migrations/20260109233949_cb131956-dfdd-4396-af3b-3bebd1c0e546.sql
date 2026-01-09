-- Create a secure public view exposing ONLY safe profile fields
-- This enables unauthenticated access to basic profile info without broad RLS policies
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;

-- Grant public read access to the view
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.public_profiles IS 
  'Public-safe profile fields for unauthenticated access. Excludes email, role, is_suspended, admin fields.';