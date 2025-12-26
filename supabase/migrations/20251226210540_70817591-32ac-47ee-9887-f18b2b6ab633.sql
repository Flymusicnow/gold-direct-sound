-- First, expand the type CHECK constraint to include 'agency' as a valid type
ALTER TABLE public.collab_entities DROP CONSTRAINT IF EXISTS collab_entities_type_check;
ALTER TABLE public.collab_entities ADD CONSTRAINT collab_entities_type_check 
  CHECK (type IN ('brand', 'festival', 'sponsor', 'event_agency', 'agency'));

-- Update the trigger function to map company_type values correctly
CREATE OR REPLACE FUNCTION public.handle_brand_application_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entity_id uuid;
  v_slug text;
  v_entity_type text;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Find user by email
    SELECT id INTO v_user_id
    FROM profiles
    WHERE email = NEW.email;
    
    -- If no user found, try auth.users
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id
      FROM auth.users
      WHERE email = NEW.email;
    END IF;
    
    -- Map company_type to valid collab_entities.type values
    v_entity_type := CASE NEW.company_type
      WHEN 'agency' THEN 'event_agency'
      WHEN 'record_label' THEN 'brand'
      WHEN 'media' THEN 'brand'
      WHEN 'venue' THEN 'festival'
      ELSE COALESCE(NEW.company_type, 'brand')
    END;
    
    -- Generate slug from company name
    v_slug := lower(regexp_replace(NEW.company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    
    -- Ensure slug is unique by appending random suffix if needed
    IF EXISTS (SELECT 1 FROM collab_entities WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substring(gen_random_uuid()::text, 1, 8);
    END IF;
    
    -- Create the collab_entity
    INSERT INTO public.collab_entities (
      name,
      slug,
      type,
      description,
      website,
      budget_range,
      is_active
    ) VALUES (
      NEW.company_name,
      v_slug,
      v_entity_type,
      NEW.campaign_goals,
      NEW.website,
      NEW.budget_range,
      true
    )
    RETURNING id INTO v_entity_id;
    
    -- Create collab_entity_admins record if user exists
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.collab_entity_admins (
        collab_entity_id,
        user_id,
        role
      ) VALUES (
        v_entity_id,
        v_user_id,
        'owner'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_brand_application_approved ON public.brand_applications;
CREATE TRIGGER on_brand_application_approved
  AFTER UPDATE ON public.brand_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_brand_application_approval();