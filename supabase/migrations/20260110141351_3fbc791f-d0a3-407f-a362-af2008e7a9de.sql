-- Step 1: Clean existing violation
DELETE FROM public.user_roles 
WHERE user_id = '866519e7-296a-48a1-8192-b4d3cd230476' 
  AND role = 'fan';

-- Step 2: Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS check_single_role ON public.user_roles;

-- Step 3: Create trigger function with security settings
CREATE OR REPLACE FUNCTION public.enforce_single_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admin/super_admin to coexist with other roles
  IF NEW.role IN ('admin', 'super_admin') THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a different primary role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.user_id 
      AND role IN ('artist', 'fan', 'brand')
      AND role != NEW.role
      AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User can only have one primary role (artist, fan, or brand).';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger on INSERT OR UPDATE
CREATE TRIGGER check_single_role
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_user_role();