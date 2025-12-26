-- Create function to auto-create collab_entity when brand application is approved
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
      NEW.company_type,
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

-- Create trigger on brand_applications
DROP TRIGGER IF EXISTS on_brand_application_approved ON public.brand_applications;
CREATE TRIGGER on_brand_application_approved
  AFTER UPDATE ON public.brand_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_brand_application_approval();