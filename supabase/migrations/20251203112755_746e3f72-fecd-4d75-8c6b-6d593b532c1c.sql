-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy: users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for admins to view all profiles (for admin features)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());