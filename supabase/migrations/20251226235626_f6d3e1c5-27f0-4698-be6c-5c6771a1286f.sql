-- Create a trigger function to enforce single primary role
CREATE OR REPLACE FUNCTION public.check_single_primary_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admin/super_admin roles to coexist with primary roles
  IF NEW.role::text IN ('admin', 'super_admin') THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a different primary role (artist, fan, or brand)
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.user_id 
    AND role::text IN ('artist', 'fan', 'brand')
    AND role != NEW.role
  ) THEN
    RAISE EXCEPTION 'User can only have one primary role (artist, fan, or brand)';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single primary role on insert
CREATE TRIGGER enforce_single_primary_role
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.check_single_primary_role();