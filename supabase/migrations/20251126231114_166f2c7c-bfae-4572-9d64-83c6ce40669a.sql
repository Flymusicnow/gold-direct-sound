-- Insert missing profiles for existing auth.users
-- This fixes the issue where some users don't have profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  COALESCE((u.raw_user_meta_data->>'role')::app_role, 'fan')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;